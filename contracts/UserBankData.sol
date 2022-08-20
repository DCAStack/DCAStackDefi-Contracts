//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

//contract contains User Funds
contract UserBankData is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public userTokenBalances;
    mapping(address => EnumerableSet.AddressSet) internal _userTokens;
    mapping(address => uint256) public userGasBalances;
    EnumerableSet.AddressSet internal _userGasAddresses;

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

    function removeUserToken(address _user, address _token) internal {
        if (userTokenBalances[_user][_token] == 0) {
            _userTokens[_user].remove(_token);
        }
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
