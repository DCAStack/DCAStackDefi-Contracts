//SPDX-License-Identifier: GNU AGPLv3

pragma solidity ^0.8.9;

import {EnumerableSetUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

//create new user schedule and validate
contract UserScheduleData {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    struct DcaSchedule {
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
    EnumerableSetUpgradeable.AddressSet internal _userAddresses;

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

    function calculateExecutions(
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate
    ) public pure returns (uint256) {
        require(_endDate > _startDate, "Invalid dates!");
        require((_endDate - _startDate) >= _tradeFrequency, "Invalid exec!");

        return ((_endDate - _startDate) / (_tradeFrequency));
    }
}
