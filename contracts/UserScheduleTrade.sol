//SPDX-License-Identifier: GNU AGPLv3

pragma solidity ^0.8.9;

import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./UserBankData.sol";
import "./UserScheduleData.sol";

//contract executes User DCA Schedules
contract UserScheduleTrade is
    UserBankData,
    UserScheduleData,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable
{
    uint256 constant MAX_INT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    bytes32 public constant RUNNER_ROLE = keccak256("RUNNER_ROLE");

    event BoughtTokens(
        uint256 indexed dcaScheduleId,
        address sellToken,
        address buyToken,
        uint256 soldAmount,
        uint256 boughtAmount,
        uint256 remainingBudget,
        bool scheduleStatus,
        uint256 gasUsed,
        uint256 gasRemaining,
        uint256 nextRun,
        address indexed dcaOwner
    );

    function updateUserDCA(
        address dcaOwner,
        uint256 scheduleId,
        uint256[2] memory tradeAmounts,
        uint256 gasUsed,
        uint256 currentDateTime
    ) internal nonReentrant onlyRole(RUNNER_ROLE) {
        uint256 startGas = gasleft();
        uint256 soldAmount = tradeAmounts[0];
        uint256 boughtAmount = tradeAmounts[1];

        userToDcaSchedules[dcaOwner][scheduleId].remainingBudget =
            userToDcaSchedules[dcaOwner][scheduleId].remainingBudget -
            soldAmount;
        userTokenBalances[dcaOwner][
            userToDcaSchedules[dcaOwner][scheduleId].sellToken
        ] =
            userTokenBalances[dcaOwner][
                userToDcaSchedules[dcaOwner][scheduleId].sellToken
            ] -
            soldAmount;

        userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[
                1
            ] = userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2];

        if (userToDcaSchedules[dcaOwner][scheduleId].remainingBudget == 0) {
            userToDcaSchedules[dcaOwner][scheduleId].isActive = false;
        } else {
            uint256 numExec = calculateExecutions(
                userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency,
                userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2], //nextRun
                userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[3] //endDate
            );

            //next run
            userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2] =
                currentDateTime +
                userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency;

            //end date
            userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[3] =
                currentDateTime +
                (userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency *
                    numExec);
        }

        userTokenBalances[dcaOwner][
            userToDcaSchedules[dcaOwner][scheduleId].buyToken
        ] =
            userTokenBalances[dcaOwner][
                userToDcaSchedules[dcaOwner][scheduleId].buyToken
            ] +
            boughtAmount;

        userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[
                1
            ] = currentDateTime;
        userToDcaSchedules[dcaOwner][scheduleId].soldAmount += soldAmount;
        userToDcaSchedules[dcaOwner][scheduleId].boughtAmount += boughtAmount;

        uint256 gasCalc = (gasUsed + (startGas - gasleft())) * tx.gasprice;
        userGasBalances[dcaOwner] -= gasCalc;
        userToDcaSchedules[dcaOwner][scheduleId].totalGas += gasCalc;

        (bool success, ) = msg.sender.call{value: gasCalc}("");
        require(success, "Gas refund failed!");

        DcaSchedule memory u = userToDcaSchedules[dcaOwner][scheduleId];
        uint256 remGas = userGasBalances[dcaOwner];
        {
            emit BoughtTokens(
                scheduleId,
                u.sellToken,
                u.buyToken,
                soldAmount,
                boughtAmount,
                u.remainingBudget,
                u.isActive,
                gasCalc,
                remGas,
                u.scheduleDates[2], //startDate, lastRun, nextRun, endDate
                dcaOwner
            );
        }
    }

    function isETH(IERC20Upgradeable token) internal pure returns (bool) {
        return (token == IERC20Upgradeable(ETH));
    }

    function runUserDCA(
        address dcaOwner,
        uint256 scheduleId,
        uint256 currentGasPrice,
        uint256 currentDateTime,
        address spender,
        address payable swapTarget,
        bytes calldata swapCallData
    ) external payable onlyRole(RUNNER_ROLE) {
        uint256 startGas = gasleft();

        DcaSchedule memory currSchedule = userToDcaSchedules[dcaOwner][
            scheduleId
        ];

        require(
            currentDateTime >= currSchedule.scheduleDates[2], //startDate, lastRun, nextRun, endDate
            "Not Ready!"
        );

        require(currSchedule.isActive == true, "Complete!");

        require(currSchedule.remainingBudget > 0, "Schedule complete!");

        require(userGasBalances[dcaOwner] > currentGasPrice, "Low Gas!");

        require(
            userTokenBalances[dcaOwner][currSchedule.sellToken] >=
                currSchedule.tradeAmount,
            "Low Balance!"
        );

        IERC20Upgradeable sellToken = IERC20Upgradeable(currSchedule.sellToken);
        IERC20Upgradeable buyToken = IERC20Upgradeable(currSchedule.buyToken);

        uint256[2] memory tradeAmounts = swap(
            currSchedule,
            sellToken,
            buyToken,
            spender,
            swapTarget,
            swapCallData
        );

        updateUserDCA(
            dcaOwner,
            scheduleId,
            tradeAmounts,
            startGas - gasleft(),
            currentDateTime
        );
    }

    function swap(
        DcaSchedule memory currSchedule,
        IERC20Upgradeable sellToken,
        IERC20Upgradeable buyToken,
        address spender,
        address payable swapTarget,
        bytes calldata swapCallData
    ) internal onlyRole(RUNNER_ROLE) returns (uint256[2] memory) {
        if (
            sellToken.allowance(address(this), spender) <
            currSchedule.tradeAmount
        ) {
            sellToken.approve(spender, MAX_INT);
        }

        uint256 boughtAmount;
        if (!isETH(buyToken)) {
            boughtAmount = buyToken.balanceOf(address(this));
        } else {
            boughtAmount = address(this).balance;
        }

        uint256 soldAmount = sellToken.balanceOf(address(this));

        (bool success, ) = swapTarget.call{value: msg.value}(swapCallData);
        require(success, "SWAP_CALL_FAILED");

        if (!isETH(buyToken)) {
            boughtAmount = buyToken.balanceOf(address(this)) - boughtAmount;
        } else {
            boughtAmount = address(this).balance - boughtAmount;
        }

        soldAmount = soldAmount - sellToken.balanceOf(address(this));

        return [soldAmount, boughtAmount];
    }
}
