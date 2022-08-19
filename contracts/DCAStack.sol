//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "./UserScheduleTrade.sol";
import "./UserScheduleBank.sol";
import "./UserScheduleFactory.sol";

/// @custom:security-contact admin@dcastack.com
contract DCAStack is UserScheduleTrade, UserScheduleBank, UserScheduleFactory {
    function withdrawContractGas(
        uint256 withdrawAmount,
        address payable receiver
    ) external onlyOwner {
        uint256 totalUserGas = getAllUsersGasBalances();
        uint256 totalContractBal = address(this).balance;
        uint256 maxWithdrawAllowed = totalContractBal - totalUserGas;

        require(
            withdrawAmount <= maxWithdrawAllowed,
            "Cannot withdraw more than max!"
        );
        (bool success, ) = receiver.call{value: withdrawAmount}("");
        require(success, "Contract withdrawal failed!");
    }

    function redistrubuteGas() external onlyOwner {
        uint256 totalUsers = getUserGasAddressLength();
        uint256 totalGas = getAllUsersGasBalances();
        uint256 totalContractBal = address(this).balance;
        uint256 maxWithdrawAllowed = totalContractBal - totalGas;

        uint256 gasRefundPerUser = maxWithdrawAllowed / totalUsers;

        require(totalUsers > 1, "Not enough users!");
        for (uint256 i; i < totalUsers; i++) {
            address user = getUserGasAddressAt(i);
            userGasBalances[user] += gasRefundPerUser;
        }
    }
}
