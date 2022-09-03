//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./UserScheduleTrade.sol";
import "./UserScheduleBank.sol";
import "./UserScheduleFactory.sol";

/// @custom:security-contact admin@dcastack.com
contract DCAStack is UserScheduleTrade, UserScheduleBank, UserScheduleFactory {

}
