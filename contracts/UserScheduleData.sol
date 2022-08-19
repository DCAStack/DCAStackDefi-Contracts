//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

//create new user schedule and validate
contract UserScheduleData {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct DcaSchedule {
        address dcaOwner;
        uint256 tradeFrequency;
        uint256 tradeAmount;
        uint256 remainingBudget;
        address buyToken;
        address sellToken;
        bool isActive;
        uint256[4] scheduleDates; //startDate, lastRun, nextRun, endDate
        uint256 soldAmount;
        uint256 boughtAmount;
        uint256 totalGas;
    }

    mapping(address => DcaSchedule[]) public userToDcaSchedules;
    EnumerableSet.AddressSet internal _userAddresses;

    function addUser() internal {
        _userAddresses.add(msg.sender);
    }

    function getAllUsersSchedules()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        uint256 length = _userAddresses.length();
        address[] memory retrieveUsers = new address[](length);
        uint256[] memory totalSchedules = new uint256[](length);

        for (uint256 i; i < length; i++) {
            retrieveUsers[i] = _userAddresses.at(i);
            totalSchedules[i] = userToDcaSchedules[retrieveUsers[i]].length;
        }
        return (retrieveUsers, totalSchedules);
    }

    function removeUserFromSet() internal {
        if (userToDcaSchedules[msg.sender].length == 0) {
            _userAddresses.remove(msg.sender);
        }
    }
}
