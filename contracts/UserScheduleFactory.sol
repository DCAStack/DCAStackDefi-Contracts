//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "./UserBankData.sol";
import "./UserScheduleData.sol";

//create new user schedule and validate
contract UserScheduleFactory is UserBankData, UserScheduleData {
    event NewUserSchedule(
        uint256 indexed dcaScheduleId,
        address buyToken,
        address sellToken,
        address indexed dcaOwner
    );

    function deleteSchedule(uint256 _dcaScheduleId) external {
        delete userToDcaSchedules[msg.sender][_dcaScheduleId];
        userToDcaSchedules[msg.sender][_dcaScheduleId] = userToDcaSchedules[
            msg.sender
        ][userToDcaSchedules[msg.sender].length - 1];
        userToDcaSchedules[msg.sender].pop();

        removeUserFromSet();
    }

    function changeStatus(uint256 _dcaScheduleId, bool _newStatus) external {
        userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = _newStatus;
    }

    function getUserSchedules() public view returns (DcaSchedule[] memory) {
        return userToDcaSchedules[msg.sender];
    }

    //get funds deposited not in use by schedules (includes paused)
    function getFreeTokenBalance(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        DcaSchedule[] memory allUserSchedules = getUserSchedules();

        uint256 totalUserDeposit = userTokenBalances[msg.sender][_tokenAddress];
        uint256 freeDepositBal;

        if (allUserSchedules.length == 0) {
            freeDepositBal = totalUserDeposit;
        } else {
            uint256 committedBal;

            for (uint256 i; i < allUserSchedules.length; i++) {
                if (allUserSchedules[i].sellToken == _tokenAddress) {
                    committedBal += allUserSchedules[i].remainingBudget;
                }
            }

            freeDepositBal = totalUserDeposit - committedBal;
        }

        return freeDepositBal;
    }

    //calculate number of runs
    function calculateExecutions(
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate
    ) public pure returns (uint256) {
        //validation checks
        require(_endDate > _startDate, "Invalid dates!");
        require((_endDate - _startDate) >= _tradeFrequency, "Invalid exec!");

        return ((_endDate - _startDate) / (_tradeFrequency));
    }

    //calculate needed deposit to start schedule factoring in existing schedules
    function calculateDeposit(
        uint256 _tradeAmount, //needs to be converted with token decimals
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate,
        address _sellToken
    ) public view returns (uint256) {
        uint256 totalExecutions = calculateExecutions(
            _tradeFrequency,
            _startDate,
            _endDate
        );

        require(totalExecutions > 0, "Invalid!");
        require(_tradeAmount > 0, "Not 0!");

        uint256 totalBudget = _tradeAmount * totalExecutions;
        uint256 gotFreeTokenBalance = getFreeTokenBalance(_sellToken);

        uint256 neededDeposit = 0;

        //return 0 if negative
        if (totalBudget > gotFreeTokenBalance) {
            neededDeposit = totalBudget - gotFreeTokenBalance;
        }

        return neededDeposit;
    }

    //validate schedule before creation
    function validateDcaSchedule(
        address _sellToken,
        uint256 _tradeAmount,
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate
    ) public view {
        uint256 currTokenBalance = getFreeTokenBalance(_sellToken);
        uint256 checkAmount = calculateDeposit(
            _tradeAmount,
            _tradeFrequency,
            _startDate,
            _endDate,
            _sellToken
        );
        require(currTokenBalance >= checkAmount, "Low balance!");

        uint256 currGasBalance = userGasBalances[msg.sender];
        require(currGasBalance > 0, "Low gas!");
    }

    function createDcaSchedule(
        uint256 _tradeFrequency,
        uint256 _tradeAmount,
        address _buyToken,
        address _sellToken,
        uint256 _startDate,
        uint256 _endDate
    ) external {
        uint256 totalExec = calculateExecutions(
            _tradeFrequency,
            _startDate,
            _endDate
        );
        uint256 totalBudget = _tradeAmount * totalExec;

        validateDcaSchedule(
            _sellToken,
            _tradeAmount,
            _tradeFrequency,
            _startDate,
            _endDate
        );

        // _userAddresses.add(msg.sender);
        addUser();

        userToDcaSchedules[msg.sender].push(
            DcaSchedule(
                msg.sender,
                _tradeFrequency,
                _tradeAmount,
                totalBudget,
                totalBudget,
                _buyToken,
                _sellToken,
                true,
                _startDate,
                0,
                _startDate,
                _endDate
            )
        );

        emit NewUserSchedule(
            userToDcaSchedules[msg.sender].length - 1,
            _buyToken,
            _sellToken,
            msg.sender
        );
    }
}
