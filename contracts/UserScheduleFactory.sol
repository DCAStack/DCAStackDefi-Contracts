//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./UserScheduleBank.sol";
import "hardhat/console.sol";

// //use errors instead of require
// error InvalidDateRange(uint256 startDate, uint256 endDate);
// error InvalidFrequency(uint256 tradeFrequency);
// error InvalidDuration(uint256 tradeOn);
// error InvalidExecutions(uint256 possibleExc, uint256 tradeFrequency);

//create new user schedule and validate
contract UserScheduleFactory is UserScheduleBank {

    event NewUserSchedule(
        uint256 indexed dcaScheduleId,
        address buyToken,
        address sellToken,
        address indexed initator
    );

    struct DcaSchedule {
        address dcaOwner;
        uint256 tradeFrequency;
        uint256 tradeAmount;
        uint256 remainingBudget;
        // uint256 totalBudget;
        address buyToken;
        address sellToken;
        bool    isActive;
        uint256 startDate;
        uint256 lastRun;
        uint256 nextRun;
        uint256 endDate;
        // uint256 remainingExec;
        // uint256 totalExec;
    }

    mapping(address => DcaSchedule[]) internal userToDcaSchedules;

    function getUserSchedules() public view returns (DcaSchedule[] memory) {
        return userToDcaSchedules[msg.sender];
    }

    //get funds deposited not in use by schedules (includes paused)
    function getFreeTokenBalance(address _tokenAddress) public view returns(uint256){
        DcaSchedule[] memory allUserSchedules = getUserSchedules();

        uint256 totalUserDeposit = getUserTokenBalance(_tokenAddress);
        uint256 freeDepositBal = 0;
        uint256 committedBal = 0;
        uint256 userSchedulesLength = allUserSchedules.length;

        if (userSchedulesLength == 0){
            freeDepositBal = totalUserDeposit;
        }else{

            for (uint256 i; i < userSchedulesLength; i++) {
                if (allUserSchedules[i].sellToken == _tokenAddress){
                    committedBal += allUserSchedules[i].remainingBudget;
                }
            }

            freeDepositBal = totalUserDeposit - committedBal;

        }

        return freeDepositBal;
    }

    //calculate number of runs
    function calculateExecutions(uint256 _tradeFrequency,
                                uint256 _startDate,
                                uint256 _endDate
                                ) public pure returns(uint256){

        //validation checks
        require(_endDate > _startDate, "End date needs to be greater than start date!");
        require((_endDate-_startDate) >= _tradeFrequency, "Trade frequency greater than possible executions!");

        return ((_endDate-_startDate) / (_tradeFrequency));

    }

    //calculate needed deposit to start schedule factoring in existing schedules
    function calculateDeposit(uint256 _tradeAmount, //needs to be converted with token decimals
                                uint256 _tradeFrequency,
                                uint256 _startDate,
                                uint256 _endDate,
                                address _sellToken
                                ) public view returns(uint256){

        uint256 totalExecutions = calculateExecutions(_tradeFrequency, _startDate, _endDate);
        
        require(totalExecutions > 0, "Please enter valid values!");
        require(_tradeAmount > 0, "Trade amount has to be greater than 0!");

        uint256 totalBudget = _tradeAmount*totalExecutions;
        uint256 gotFreeTokenBalance = getFreeTokenBalance(_sellToken);

        uint256 neededDeposit = 0;

        //return 0 if negative
        if (totalBudget > gotFreeTokenBalance){
            neededDeposit = totalBudget - gotFreeTokenBalance;
        }

        return neededDeposit;
    }

    //validate schedule before creation
    function validateDcaSchedule(address _sellToken,
                                uint256 _tradeAmount, 
                                uint256 _tradeFrequency,
                                uint256 _startDate,
                                uint256 _endDate
                                    ) public view returns(bool){

        uint256 currTokenBalance = getFreeTokenBalance(_sellToken);
        uint256 checkAmount = calculateDeposit(_tradeAmount, _tradeFrequency, _startDate, _endDate, _sellToken);
        require(currTokenBalance >= checkAmount, "Please deposit more to start this DCA schedule!");

        uint256 currGasBalance = getUserGasBalance();
        require(currGasBalance > 0, "Please deposit more gas to start!");

        return true;
    }

    function createDcaSchedule(
            uint256 _tradeFrequency,
            uint256 _tradeAmount,
            address _buyToken,
            address _sellToken,
            uint256 _startDate,
            uint256 _endDate
        ) external {

            uint256 totalExec = calculateExecutions(_tradeFrequency, _startDate, _endDate);
            uint256 totalBudget = _tradeAmount*totalExec;

            validateDcaSchedule( _sellToken,
                                _tradeAmount, 
                                _tradeFrequency,
                                _startDate,
                                _endDate
                                );

            userToDcaSchedules[msg.sender].push(
                DcaSchedule(
                    msg.sender,
                    _tradeFrequency,
                    _tradeAmount,
                    totalBudget,
                    // totalBudget,
                    _buyToken,
                    _sellToken,
                    true,
                    _startDate,
                    0,
                    _startDate,
                    _endDate
                    // totalExec,
                    // totalExec
                ));
            
            emit NewUserSchedule(userToDcaSchedules[msg.sender].length - 1, _buyToken, _sellToken, msg.sender);
        }
    
}
