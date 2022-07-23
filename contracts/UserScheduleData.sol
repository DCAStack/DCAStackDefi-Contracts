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
        uint256 totalBudget;
        address buyToken;
        address sellToken;
        bool isActive;
        uint256 startDate;
        uint256 lastRun;
        uint256 nextRun;
        uint256 endDate;
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
        _userAddresses.remove(msg.sender);
    }

}
