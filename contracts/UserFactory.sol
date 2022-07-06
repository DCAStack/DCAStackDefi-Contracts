//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


//create new user schedule
contract UserFactory {

    event NewUserSchedule(
        uint256 indexed dcaScheduleId,
        address indexed initator
    );

    struct DcaSchedule {
        address dcaOwner;
        uint256 tradeFrequency;
        uint256 tradeOn;
        uint256 tradeAmount;
        uint256 remainingBudget;
        uint256 totalBudget;
        address buyToken;
        address sellToken;
        bool isActive;
        uint256 startRun;
        uint256 lastRun;
        uint256 finshRun;
        uint256 remainingExec;
        uint256 totalExec;
    }

    mapping(address => DcaSchedule[]) internal userToDcaSchedules;

function createDcaSchedule(
            uint256 _tradeFrequency,
            uint256 _tradeOn,
            uint256 _tradeAmount,
            address _buyToken,
            address _sellToken,
            uint256 _startRun,
            uint256 _finshRun
        ) external {

            //add validation

            uint256 totalExec = (_finshRun-_startRun) / (60 * 60 * 24);
            uint256 totalBudget = _tradeAmount*totalExec;

            //calculate free token balances, if greater or eq to totalBudget, then only create schedule
            //if not throw error

            userToDcaSchedules[msg.sender].push(
                DcaSchedule(
                    msg.sender,
                    _tradeFrequency,
                    _tradeOn,
                    _tradeAmount,
                    totalBudget,
                    totalBudget,
                    _buyToken,
                    _sellToken,
                    true,
                    _startRun,
                    0,
                    _finshRun,
                    totalExec,
                    totalExec
                ));
            
            emit NewUserSchedule(userToDcaSchedules[msg.sender].length - 1, msg.sender);
        }
    
}
