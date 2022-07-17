//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./UserScheduleBank.sol";
import "./UserScheduleFactory.sol";
import "hardhat/console.sol";

//contract executes User DCA Schedules
contract UserScheduleTrade is UserScheduleBank, UserScheduleFactory {
    address constant AGG_ROUTER_V4 = 0x1111111254fb6c44bAC0beD2854e76F90643097d;
    uint256 MAX_INT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    event NotifyOwner(
        address indexed dcaOwner,
        bool[] scheduleRan,
        bool enoughGas
    );

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
        uint256 gasUsed
    ) internal nonReentrant onlyOwner {
        //first, update sell amounts for dcaOwner
        address sellToken = _userToDcaSchedules[dcaOwner][scheduleId].sellToken;

        _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget =
            _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget -
            soldAmount;
        userTokenBalances[dcaOwner][sellToken] =
            userTokenBalances[dcaOwner][sellToken] -
            soldAmount;

        //if rem budget or user bal is empty, schedule gets paused
        if (
            _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget == 0 ||
            userTokenBalances[dcaOwner][sellToken] == 0
        ) {
            _userToDcaSchedules[dcaOwner][scheduleId].isActive = false;
        }

        //remove tokens from set if empty
        removeUserToken(dcaOwner, sellToken);

        //second, update purchase amounts for dcaOwner
        address buyToken = _userToDcaSchedules[dcaOwner][scheduleId].buyToken;
        userTokenBalances[dcaOwner][buyToken] =
            userTokenBalances[dcaOwner][buyToken] +
            boughtAmount;

        //third, update schedule run times
        _userToDcaSchedules[dcaOwner][scheduleId].nextRun = block.timestamp;
        _userToDcaSchedules[dcaOwner][scheduleId].lastRun = _userToDcaSchedules[
            dcaOwner
        ][scheduleId].nextRun;

        //finally, update gas balance for user
        userGasBalances[dcaOwner] -= gasUsed;

        //finally emit event with all the updates/details
        uint256 remBudget = _userToDcaSchedules[dcaOwner][scheduleId]
            .remainingBudget;
        uint256 nextRun = _userToDcaSchedules[dcaOwner][scheduleId].nextRun;
        bool isActive = _userToDcaSchedules[dcaOwner][scheduleId].isActive;
        uint256 remGas = userGasBalances[dcaOwner];
        {
            emit BoughtTokens(
                scheduleId,
                sellToken,
                buyToken,
                soldAmount,
                boughtAmount,
                remBudget,
                isActive,
                gasUsed,
                remGas,
                nextRun,
                dcaOwner
            );
        }
    }

    function isETH(IERC20 token) internal pure returns (bool) {
        return (token == IERC20(ETH));
    }

    function swapDCA(address dcaOwner, uint256 scheduleId)
        public
        payable
        onlyOwner
    {
        IERC20 sellToken = IERC20(
            _userToDcaSchedules[dcaOwner][scheduleId].sellToken
        );
        IERC20 buyToken = IERC20(
            _userToDcaSchedules[dcaOwner][scheduleId].buyToken
        );
        uint256 sellAmount = _userToDcaSchedules[dcaOwner][scheduleId]
            .tradeAmount;
        bytes memory swapCallData = _userToDcaSchedules[dcaOwner][scheduleId]
            .swapCallData;

        //get current gas
        uint256 startGas = gasleft();

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

        //get updated gas balance
        uint256 gasUsed = startGas - gasleft();

        updateUserDCA(dcaOwner, scheduleId, soldAmount, boughtAmount, gasUsed);
    }

    function runSchedules(uint256 currentDateTime, uint256 currentGasPrice)
        external
        onlyOwner
    {
        address[] memory retrieveUsers = getUsers();
        uint256 allUsers = retrieveUsers.length;

        //iterate owners
        for (uint256 i; i < allUsers; i++) {
            address checkOwner = retrieveUsers[i];
            uint256 ownerGas = userGasBalances[checkOwner];

            uint256 ownerScheduleLength = _userToDcaSchedules[checkOwner]
                .length;
            bool[] memory scheduleRanNotification = new bool[](
                ownerScheduleLength
            );
            bool gasBalNotify = false;

            //check gas
            if (ownerGas > currentGasPrice) {
                //iterate owner schedules
                for (uint256 j; j < ownerScheduleLength; j++) {
                    //check token
                    address sellToken = _userToDcaSchedules[checkOwner][j]
                        .sellToken;
                    uint256 tradeAmount = _userToDcaSchedules[checkOwner][j]
                        .tradeAmount;
                    if (
                        userTokenBalances[checkOwner][sellToken] >= tradeAmount
                    ) {
                        //check if schedule is active
                        bool scheduleUp = _userToDcaSchedules[checkOwner][j]
                            .isActive;
                        if (scheduleUp == true) {
                            //check if schedule has remaining budget
                            uint256 scheduleBudget = _userToDcaSchedules[
                                checkOwner
                            ][j].remainingBudget;
                            if (scheduleBudget > 0) {
                                //check if schedule is ready to execute
                                uint256 executeWhen = _userToDcaSchedules[
                                    checkOwner
                                ][j].nextRun;
                                if (executeWhen >= currentDateTime) {
                                    //perform swap
                                    if (sellToken == ETH) {
                                        swapDCA(checkOwner, j);
                                    } else {
                                        swapDCA(checkOwner, j);
                                    }
                                    scheduleRanNotification[j] = true;
                                }
                            }
                        }
                    } else {
                        //notify user for insufficient balance
                        scheduleRanNotification[j] = false;
                    }
                }
            } else {
                //notify user for low gas
                gasBalNotify = true;
            }

            //emit event
            emit NotifyOwner(checkOwner, scheduleRanNotification, gasBalNotify);
        }
    }

    // Payable fallback to allow this contract to receive protocol fee refunds.
    receive() external payable {}
}
