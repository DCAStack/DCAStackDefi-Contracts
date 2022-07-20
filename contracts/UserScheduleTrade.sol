//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "./UserScheduleBank.sol";
import "./UserScheduleFactory.sol";
import "hardhat/console.sol";

//contract executes User DCA Schedules
contract UserScheduleTrade is UserScheduleBank, UserScheduleFactory {
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
        _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget =
            _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget -
            soldAmount;
        userTokenBalances[dcaOwner][
            _userToDcaSchedules[dcaOwner][scheduleId].sellToken
        ] =
            userTokenBalances[dcaOwner][
                _userToDcaSchedules[dcaOwner][scheduleId].sellToken
            ] -
            soldAmount;

        //if rem budget or user bal is empty, schedule gets paused
        if (
            _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget == 0 ||
            userTokenBalances[dcaOwner][
                _userToDcaSchedules[dcaOwner][scheduleId].sellToken
            ] ==
            0
        ) {
            _userToDcaSchedules[dcaOwner][scheduleId].isActive = false;
            _userToDcaSchedules[dcaOwner][scheduleId].nextRun = 0;
        } else {
            //if still good, update next run
            _userToDcaSchedules[dcaOwner][scheduleId].nextRun =
                currentDateTime +
                _userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency;
        }

        //remove tokens from set if empty
        removeUserToken(
            dcaOwner,
            _userToDcaSchedules[dcaOwner][scheduleId].sellToken
        );

        //second, update purchase amounts for dcaOwner
        userTokenBalances[dcaOwner][
            _userToDcaSchedules[dcaOwner][scheduleId].buyToken
        ] =
            userTokenBalances[dcaOwner][
                _userToDcaSchedules[dcaOwner][scheduleId].buyToken
            ] +
            boughtAmount;

        //third, update schedule last run time
        _userToDcaSchedules[dcaOwner][scheduleId].lastRun = currentDateTime;

        //finally, update gas balance for user
        userGasBalances[dcaOwner] -= gasUsed;

        //finally emit event with all the updates/details
        DcaSchedule memory u = _userToDcaSchedules[dcaOwner][scheduleId];
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
                u.nextRun,
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
        require(
            userGasBalances[dcaOwner] > currentGasPrice,
            "User low on gas!"
        );

        //schedule not ready to execute
        require(
            currentDateTime >=
                _userToDcaSchedules[dcaOwner][scheduleId].nextRun,
            "User schedule not ready!"
        );

        //schedule not active
        require(
            _userToDcaSchedules[dcaOwner][scheduleId].isActive == true,
            "User schedule paused!"
        );

        //check if user has enough for trade
        address sellTokenAddress = _userToDcaSchedules[dcaOwner][scheduleId]
            .sellToken;
        uint256 sellAmount = _userToDcaSchedules[dcaOwner][scheduleId]
            .tradeAmount;
        require(
            userTokenBalances[dcaOwner][sellTokenAddress] >= sellAmount,
            "User token balance insufficient!"
        );

        // //schedule has no budget left
        // require(
        //     _userToDcaSchedules[dcaOwner][scheduleId].remainingBudget >=
        //         sellAmount,
        //     "User schedule fund insufficient!"
        // );

        IERC20 sellToken = IERC20(sellTokenAddress);
        IERC20 buyToken = IERC20(
            _userToDcaSchedules[dcaOwner][scheduleId].buyToken
        );

        //get current gas
        // uint256 startGas = gasleft();

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
        // uint256 gasUsed = startGas - gasleft();

        // console.log("owner: ", dcaOwner);
        // console.log("id: ", scheduleId);
        // console.log("soldAmount: ", soldAmount);
        // console.log("boughtAmount: ", boughtAmount);
        // console.log("gasUsed: ", gasUsed);

        updateUserDCA(
            dcaOwner,
            scheduleId,
            soldAmount,
            boughtAmount,
            currentGasPrice,
            currentDateTime
        );
    }

    // function runSchedules(uint256 currentDateTime, uint256 currentGasPrice)
    //     external
    //     onlyOwner
    // {
    //     address[] memory retrieveUsers = getUsers();
    //     uint256 allUsers = retrieveUsers.length;

    //     //iterate owners
    //     for (uint256 i; i < allUsers; i++) {
    //         address checkOwner = retrieveUsers[i];

    //         uint256 ownerScheduleLength = _userToDcaSchedules[checkOwner]
    //             .length;
    //         bool[] memory scheduleRanNotification = new bool[](
    //             ownerScheduleLength
    //         );
    //         bool gasBalNotify = false;

    //         //check gas
    //         if (userGasBalances[checkOwner] > currentGasPrice) {
    //             //iterate owner schedules
    //             for (uint256 j; j < ownerScheduleLength; j++) {
    //                 //check token
    //                 address sellToken = _userToDcaSchedules[checkOwner][j]
    //                     .sellToken;
    //                 uint256 tradeAmount = _userToDcaSchedules[checkOwner][j]
    //                     .tradeAmount;
    //                 if (
    //                     userTokenBalances[checkOwner][sellToken] >= tradeAmount
    //                 ) {
    //                     //check if schedule is active
    //                     if (
    //                         _userToDcaSchedules[checkOwner][j].isActive == true
    //                     ) {
    //                         //check if schedule has remaining budget
    //                         if (
    //                             _userToDcaSchedules[checkOwner][j]
    //                                 .remainingBudget > 0
    //                         ) {
    //                             //check if schedule is ready to execute
    //                             {
    //                                 if (
    //                                     currentDateTime >=
    //                                     _userToDcaSchedules[checkOwner][j]
    //                                         .nextRun
    //                                 ) {
    //                                     //return ready schedules
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 } else {
    //                     //notify user for insufficient balance
    //                     scheduleRanNotification[j] = false;
    //                 }
    //             }
    //         } else {
    //             //notify user for low gas
    //             gasBalNotify = true;
    //         }

    //         //emit event
    //         // emit NotifyOwner(checkOwner, scheduleRanNotification, gasBalNotify);
    //     }
    // }

    // Payable fallback to allow this contract to receive protocol fee refunds.
    receive() external payable {}
}
