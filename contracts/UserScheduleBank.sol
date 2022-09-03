//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./UserBankData.sol";

//contract contains User Funds
contract UserScheduleBank is UserBankData, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event FundsDeposited(address indexed sender, address token, uint256 amount);
    event FundsWithdrawn(
        address indexed receiver,
        address token,
        uint256 amount
    );

    function depositGas() public payable {
        uint256 depositAmount = msg.value;
        userGasBalances[msg.sender] =
            userGasBalances[msg.sender] +
            depositAmount;

        addUserGasAddress(msg.sender);
        emit FundsDeposited(msg.sender, ETH, depositAmount);
    }

    receive() external payable {
        depositGas();
    }

    fallback() external payable {
        depositGas();
    }

    function withdrawGas(uint256 _tokenAmount) external nonReentrant {
        require(
            userGasBalances[msg.sender] >= _tokenAmount,
            "Cannot withdraw more gas than deposited!"
        );
        userGasBalances[msg.sender] =
            userGasBalances[msg.sender] -
            _tokenAmount;

        (bool success, ) = msg.sender.call{value: _tokenAmount}("");
        require(success, "withdrawGas failed!");

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

        userTokenBalances[msg.sender][_tokenAddress] =
            userTokenBalances[msg.sender][_tokenAddress] +
            depositAmount;

        addUserToken(msg.sender, _tokenAddress);

        emit FundsDeposited(msg.sender, _tokenAddress, depositAmount);
    }

    function withdrawFunds(address _tokenAddress, uint256 _tokenAmount)
        external
        nonReentrant
    {
        uint256 userBalance = userTokenBalances[msg.sender][_tokenAddress];

        require(
            userBalance >= _tokenAmount,
            "Cannot withdraw more than deposited!"
        );

        userTokenBalances[msg.sender][_tokenAddress] -= _tokenAmount;

        if (_tokenAddress == ETH) {
            (bool success, ) = msg.sender.call{value: _tokenAmount}("");
            require(success, "withdrawFunds failed!");
        } else {
            SafeERC20.safeTransfer(
                IERC20(_tokenAddress),
                msg.sender,
                _tokenAmount
            );
        }

        // removeUserToken(msg.sender, _tokenAddress);

        emit FundsWithdrawn(msg.sender, _tokenAddress, _tokenAmount);
    }
}
