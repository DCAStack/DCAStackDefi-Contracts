//SPDX-License-Identifier: GNU AGPLv3

pragma solidity ^0.8.9;

import {EnumerableSetUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import {SafeERC20Upgradeable, IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

//contract contains User Funds
contract UserBankData is OwnableUpgradeable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    mapping(address => mapping(address => uint256)) public userTokenBalances;
    mapping(address => EnumerableSetUpgradeable.AddressSet)
        internal _userTokens;
    mapping(address => uint256) public userGasBalances;
    EnumerableSetUpgradeable.AddressSet internal _userGasAddresses;

    function getUserTokensLength() internal view returns (uint256) {
        return _userTokens[msg.sender].length();
    }

    function getUserTokenAddressAt(uint256 index)
        internal
        view
        returns (address token)
    {
        return _userTokens[msg.sender].at(index);
    }

    function addUserToken(address _user, address _token) internal {
        if (!_userTokens[_user].contains(_token)) {
            _userTokens[_user].add(_token);
        }
    }

    function addUserGasAddress(address _user) internal {
        _userGasAddresses.add(_user);
    }

    function getAllUsersGasBalances() public view returns (uint256) {
        uint256 length = _userGasAddresses.length();
        uint256 totalGas;

        for (uint256 i; i < length; i++) {
            totalGas = totalGas + userGasBalances[_userGasAddresses.at(i)];
        }
        return totalGas;
    }

    function getUserGasAddressLength() internal view returns (uint256 length) {
        return _userGasAddresses.length();
    }

    function getUserGasAddressAt(uint256 index)
        internal
        view
        returns (address user)
    {
        return _userGasAddresses.at(index);
    }
}
