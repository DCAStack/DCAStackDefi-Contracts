//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "./UserScheduleTrade.sol";
import "./UserScheduleBank.sol";
import "./UserScheduleFactory.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @custom:security-contact admin@dcastack.com
contract DCAStack is
    Pausable,
    UserScheduleTrade,
    UserScheduleBank,
    UserScheduleFactory
{
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
