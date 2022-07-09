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
        delete userToDcaSchedules[msg.sender][_dcaScheduleId];
        userToDcaSchedules[msg.sender][_dcaScheduleId] = userToDcaSchedules[msg.sender][userToDcaSchedules[msg.sender].length - 1];
        userToDcaSchedules[msg.sender].pop();
    }

    function changeStatus(uint256 _dcaScheduleId, bool _newStatus)
        external
    {
        userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = _newStatus;
    }
}
