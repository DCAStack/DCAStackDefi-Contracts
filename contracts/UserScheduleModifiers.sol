//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "./UserScheduleFactory.sol";

//contract contains User DCA Schedules helpers to modify/update
contract UserScheduleModifiers is UserScheduleFactory {
    function deleteSchedule(uint256 _dcaScheduleId) external {
        delete userToDcaSchedules[msg.sender][_dcaScheduleId];
        userToDcaSchedules[msg.sender][_dcaScheduleId] = userToDcaSchedules[
            msg.sender
        ][userToDcaSchedules[msg.sender].length - 1];
        userToDcaSchedules[msg.sender].pop();

        if (userToDcaSchedules[msg.sender].length == 0) {
            removeUserFromSet();
        }
    }

    function changeStatus(uint256 _dcaScheduleId, bool _newStatus) external {
        userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = _newStatus;
    }
}
