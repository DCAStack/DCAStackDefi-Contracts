//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./UserBankData.sol";
import "./UserScheduleData.sol";

//contract executes User DCA Schedules
contract UserScheduleTrade is UserBankData, UserScheduleData, ReentrancyGuard {
    address constant AGG_ROUTER_V4 = 0x1111111254fb6c44bAC0beD2854e76F90643097d;
    uint256 MAX_INT =
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

    //function tallies user funds, gas, and schedule details
    function updateUserDCA(
        address dcaOwner,
        uint256 scheduleId,
        uint256 soldAmount,
        uint256 boughtAmount,
        uint256 gasUsed,
        uint256 currentDateTime
    ) internal nonReentrant onlyOwner {
        //first, update sell amounts for dcaOwner
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

        //update last run
        userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[1] = userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2];

        //if rem budget or user bal is empty, schedule gets paused
        if (
            userToDcaSchedules[dcaOwner][scheduleId].remainingBudget == 0 ||
            userTokenBalances[dcaOwner][
                userToDcaSchedules[dcaOwner][scheduleId].sellToken
            ] ==
            0
        ) {
            userToDcaSchedules[dcaOwner][scheduleId].isActive = false;
            // userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2] = 0;
            //startDate, lastRun, nextRun, endDate
        } else {

            //update end date if needed
            uint256 numExec = calculateExecutions(
                userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency,
                userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2], //nextRun
                userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[3] //endDate
            );

            //if still good, update next run
            userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2] =
                currentDateTime +
                userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency;

            //update end date based on when last ran
            userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[3] = currentDateTime + (userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency*numExec);
        }

        //remove tokens from set if empty
        removeUserToken(
            dcaOwner,
            userToDcaSchedules[dcaOwner][scheduleId].sellToken
        );

        //second, update purchase amounts for dcaOwner
        userTokenBalances[dcaOwner][
            userToDcaSchedules[dcaOwner][scheduleId].buyToken
        ] =
            userTokenBalances[dcaOwner][
                userToDcaSchedules[dcaOwner][scheduleId].buyToken
            ] +
            boughtAmount;

        //third, update schedule details
        userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[
                1
            ] = currentDateTime;
        userToDcaSchedules[dcaOwner][scheduleId].soldAmount += soldAmount;
        userToDcaSchedules[dcaOwner][scheduleId].boughtAmount += boughtAmount;
        userToDcaSchedules[dcaOwner][scheduleId].totalGas += gasUsed;

        //finally, update gas balance for user
        userGasBalances[dcaOwner] -= gasUsed;

        //finally emit event with all the updates/details
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
                gasUsed,
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
        bytes memory swapCallData
    ) external payable onlyOwner {

        //not enough gas check
        require(userGasBalances[dcaOwner] > currentGasPrice, "Low Gas!");

        //schedule not ready to execute
        require(
            currentDateTime >=
                userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2], //startDate, lastRun, nextRun, endDate
            "Not Ready!"
        );

        //schedule not active
        require(
            userToDcaSchedules[dcaOwner][scheduleId].isActive == true,
            "Paused!"
        );

        //check if user has enough for trade
        address sellTokenAddress = userToDcaSchedules[dcaOwner][scheduleId]
            .sellToken;
        uint256 sellAmount = userToDcaSchedules[dcaOwner][scheduleId]
            .tradeAmount;
        require(
            userTokenBalances[dcaOwner][sellTokenAddress] >= sellAmount,
            "Low Balance!"
        );

        //check rem budget
        require(userToDcaSchedules[dcaOwner][scheduleId].remainingBudget > 0, "Schedule complete!");


        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(
            userToDcaSchedules[dcaOwner][scheduleId].buyToken
        );

        //approve sell token max
        if (!isETH(sellToken)) {
            if (
                sellToken.allowance(address(this), AGG_ROUTER_V4) < sellAmount
            ) {
                sellToken.approve(AGG_ROUTER_V4, MAX_INT);
            }
        }

        //get current balance of buytoken
        uint256 boughtAmount;
        if (!isETH(buyToken)) {
            boughtAmount = buyToken.balanceOf(address(this));
        } else {
            boughtAmount = address(this).balance;
        }

        //get current balance of selltoken
        uint256 soldAmount;
        if (!isETH(sellToken)) {
            soldAmount = sellToken.balanceOf(address(this));
        } else {
            soldAmount = address(this).balance;
        }

        //perform 1inch swap
        assembly {
            let result := call(
                gas(),
                AGG_ROUTER_V4,
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

        //get updated balance post swap of buytoken
        if (!isETH(buyToken)) {
            boughtAmount = buyToken.balanceOf(address(this)) - boughtAmount;
        } else {
            boughtAmount = address(this).balance - boughtAmount;
        }

        //get updated balance post swap of selltoken
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
            currentGasPrice,
            currentDateTime
        );
    }

}
