//SPDX-License-Identifier: GNU AGPLv3

pragma solidity ^0.8.9;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./UserBankData.sol";
import "./UserScheduleData.sol";

//contract executes User DCA Schedules
contract UserScheduleTrade is UserBankData, UserScheduleData, ReentrancyGuard {
    uint256 constant MAX_INT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

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
        uint256 soldAmount,
        uint256 boughtAmount,
        uint256 gasUsed,
        uint256 currentDateTime
    ) internal nonReentrant onlyOwner {
        uint256 startGas = gasleft();

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

    function isETH(IERC20 token) internal pure returns (bool) {
        return (token == IERC20(ETH));
    }

    function runUserDCA(
        address dcaOwner,
        uint256 scheduleId,
        uint256 currentGasPrice,
        uint256 currentDateTime,
        bytes memory swapCallData,
        address aggRouter1inch
    ) external payable onlyOwner {
        uint256 startGas = gasleft();

        require(userGasBalances[dcaOwner] > currentGasPrice, "Low Gas!");

        require(
            currentDateTime >=
                userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2], //startDate, lastRun, nextRun, endDate
            "Not Ready!"
        );

        require(
            userToDcaSchedules[dcaOwner][scheduleId].isActive == true,
            "Complete!"
        );

        address sellTokenAddress = userToDcaSchedules[dcaOwner][scheduleId]
            .sellToken;
        uint256 sellAmount = userToDcaSchedules[dcaOwner][scheduleId]
            .tradeAmount;
        require(
            userTokenBalances[dcaOwner][sellTokenAddress] >= sellAmount,
            "Low Balance!"
        );

        require(
            userToDcaSchedules[dcaOwner][scheduleId].remainingBudget > 0,
            "Schedule complete!"
        );

        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(
            userToDcaSchedules[dcaOwner][scheduleId].buyToken
        );

        if (!isETH(sellToken)) {
            if (
                sellToken.allowance(address(this), aggRouter1inch) < sellAmount
            ) {
                sellToken.approve(aggRouter1inch, MAX_INT);
            }
        }

        uint256 boughtAmount;
        if (!isETH(buyToken)) {
            boughtAmount = buyToken.balanceOf(address(this));
        } else {
            boughtAmount = address(this).balance;
        }

        uint256 soldAmount;
        if (!isETH(sellToken)) {
            soldAmount = sellToken.balanceOf(address(this));
        } else {
            soldAmount = address(this).balance;
        }

        assembly {
            let result := call(
                gas(),
                aggRouter1inch,
                callvalue(),
                add(swapCallData, 0x20),
                mload(swapCallData),
                0,
                0
            )
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
        }

        if (!isETH(buyToken)) {
            boughtAmount = buyToken.balanceOf(address(this)) - boughtAmount;
        } else {
            boughtAmount = address(this).balance - boughtAmount;
        }

        if (!isETH(sellToken)) {
            soldAmount = soldAmount - sellToken.balanceOf(address(this));
        } else {
            soldAmount = soldAmount - address(this).balance;
        }

        updateUserDCA(
            dcaOwner,
            scheduleId,
            soldAmount,
            boughtAmount,
            startGas - gasleft(),
            currentDateTime
        );
    }
}
