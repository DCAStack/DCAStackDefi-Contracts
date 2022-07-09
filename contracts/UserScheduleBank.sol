//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

//contract contains User Funds
contract UserScheduleBank is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(address => mapping(address => uint256)) internal _userTokenBalances;
    mapping(address => EnumerableSet.AddressSet) internal _userTokens;
    mapping(address => uint256) internal _userGasBalances;


    event FundsDeposited(
        address indexed sender,
        address indexed token,
        uint256 indexed amount
    );
    event FundsWithdrawn(
        address indexed receiver,
        address indexed token,
        uint256 indexed amount
    );

    function debitUserFunds(address _tokenAddress, uint256 _tokenAmount)
        internal
    {
        uint256 userBalance = _userTokenBalances[msg.sender][_tokenAddress];

        require(userBalance >= _tokenAmount, "Cannot withdraw more than deposited!");

        _userTokenBalances[msg.sender][_tokenAddress] -= _tokenAmount;

        if (_tokenAmount == userBalance) {
            _userTokens[msg.sender].remove(_tokenAddress);
        }
    }

    function depositGas()        
    external
    payable
    {
        uint256 depositAmount = msg.value;
        _userGasBalances[msg.sender] = _userGasBalances[msg.sender] + depositAmount;
        emit FundsDeposited(msg.sender, ETH, depositAmount);
    }

    function withdrawGas(uint256 _tokenAmount)        
    external
    nonReentrant
    {
        require(_userGasBalances[msg.sender] >= _tokenAmount, "Cannot withdraw more gas than deposited!");
        _userGasBalances[msg.sender] = _userGasBalances[msg.sender] - _tokenAmount;
        emit FundsWithdrawn(msg.sender, ETH, _tokenAmount);
    }

    function depositFunds(address _tokenAddress, uint256 _tokenAmount)
        external
        payable
    {
        uint256 depositAmount;
        if (_tokenAddress == ETH) {
            depositAmount = msg.value;
        } else {
            IERC20 token = IERC20(_tokenAddress);
            uint256 preBalance = token.balanceOf(address(this));
            token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
            uint256 postBalance = token.balanceOf(address(this));
            depositAmount = postBalance - preBalance;
        }

        _userTokenBalances[msg.sender][_tokenAddress] =
            _userTokenBalances[msg.sender][_tokenAddress] +
            depositAmount;

        if (!_userTokens[msg.sender].contains(_tokenAddress)) {
            _userTokens[msg.sender].add(_tokenAddress);
        }

        emit FundsDeposited(msg.sender, _tokenAddress, depositAmount);
    }

    function withdrawFunds(address _tokenAddress, uint256 _tokenAmount)
        external
        nonReentrant
    {
        debitUserFunds(_tokenAddress, _tokenAmount);

        if (_tokenAddress == ETH) {
            (bool success, ) = msg.sender.call{value: _tokenAmount}("");
            require(success, "_transfer: ETH transfer failed");
        } else {
            SafeERC20.safeTransfer(
                IERC20(_tokenAddress),
                msg.sender,
                _tokenAmount
            );
        }

        emit FundsWithdrawn(msg.sender, _tokenAddress, _tokenAmount);
    }

    function getUserGasBalance()
        public
        view
        returns (uint256)
    {
        return _userGasBalances[msg.sender];
    }

    function getUserTokenBalance(address _tokenAddress)
        public
        view
        returns (uint256)
    {
        return _userTokenBalances[msg.sender][_tokenAddress];
    }

    function getUserAllTokenBalances()
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        uint256 length = _userTokens[msg.sender].length();
        address[] memory retrieveUserTokens = new address[](length);
        uint256[] memory retrieveUserBalances = new uint256[](length);

        for (uint256 i; i < length; i++) {
            retrieveUserTokens[i] = _userTokens[msg.sender].at(i);
            retrieveUserBalances[i] = _userTokenBalances[msg.sender][
                retrieveUserTokens[i]
            ];
        }
        return (retrieveUserTokens, retrieveUserBalances);
    }
}
