//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./UserScheduleFactory.sol";

//contract contains User DCA Schedules helpers to modify/update
contract UserScheduleModifiers is UserScheduleFactory {

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

    function deleteSchedule(uint256 _dcaScheduleId)
        external
    {
        delete _userToDcaSchedules[msg.sender][_dcaScheduleId];
        _userToDcaSchedules[msg.sender][_dcaScheduleId] = _userToDcaSchedules[msg.sender][_userToDcaSchedules[msg.sender].length - 1];
        _userToDcaSchedules[msg.sender].pop();

        if (_userToDcaSchedules[msg.sender].length == 0){
            removeUserFromSet();
        }
    }

    function changeStatus(uint256 _dcaScheduleId, bool _newStatus)
        external
    {
        _userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = _newStatus;
    }
}
