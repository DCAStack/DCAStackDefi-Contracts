//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./UserFactory.sol";

// import "./UserBank.sol";

//contract contains User DCA Schedules helpers
contract UserSchedule is UserFactory {
    modifier onlyOwnerOf(uint256 _dcaScheduleId) {
        require(userToDcaSchedules[msg.sender].length < _dcaScheduleId);
        require(
            msg.sender ==
                userToDcaSchedules[msg.sender][_dcaScheduleId].dcaOwner
        );
        _;
    }

    // function getFreeTokenBalance() public {

    // }

    // function validateDcaSchedule() public {

    // }

    // function calculateExecutions() public {

    // }

    // function calculateDeposit() public {

    // }

    function getUserSchedules() public view returns (DcaSchedule[] memory) {
        return userToDcaSchedules[msg.sender];
    }

    function getUserCommittedBalances()
        public
        view
        returns (DcaSchedule[] memory)
    {
        //return funds being used in schedules
        return userToDcaSchedules[msg.sender];
    }

    function getUserFreeTokenBalances()
        public
        view
        returns (DcaSchedule[] memory)
    {
        //sum all remaining budgets
        //compare against user token balance
        return userToDcaSchedules[msg.sender];
    }

    // function changeTradeOn(uint256 _dcaScheduleId, uint8 _newTradeOn)
    //     external
    //     onlyOwnerOf(_dcaScheduleId)
    // {
    //     userToDcaSchedules[msg.sender][_dcaScheduleId].tradeOn = _newTradeOn;
    // }

    // function changeTradeFrequency(
    //     uint256 _dcaScheduleId,
    //     uint8 _newTradeFrequency
    // ) external onlyOwnerOf(_dcaScheduleId) {
    //     userToDcaSchedules[msg.sender][_dcaScheduleId].tradeFrequency = _newTradeFrequency;
    // }

    // function changeTradeAmount(uint256 _dcaScheduleId, uint8 _newTradeAmount)
    //     external
    //     onlyOwnerOf(_dcaScheduleId)
    // {
    //     userToDcaSchedules[msg.sender][_dcaScheduleId].tradeAmount = _newTradeAmount;
    // }

    function changeStatus(uint256 _dcaScheduleId, bool _newStatus)
        external
        onlyOwnerOf(_dcaScheduleId)
    {
        userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = _newStatus;
    }
}
