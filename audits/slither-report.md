Summary
 - [reentrancy-no-eth](#reentrancy-no-eth) (1 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (7 results) (Medium)
 - [unused-return](#unused-return) (5 results) (Medium)
 - [missing-zero-check](#missing-zero-check) (1 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (4 results) (Low)
 - [assembly](#assembly) (4 results) (Informational)
 - [boolean-equal](#boolean-equal) (3 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [solc-version](#solc-version) (15 results) (Informational)
 - [low-level-calls](#low-level-calls) (7 results) (Informational)
 - [naming-convention](#naming-convention) (42 results) (Informational)
 - [constable-states](#constable-states) (1 results) (Optimization)
 - [external-function](#external-function) (2 results) (Optimization)
## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-0
Reentrancy in [UserScheduleTrade.runUserDCA(address,uint256,uint256,uint256,bytes)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241):
	External calls:
	- [sellToken.approve(AGG_ROUTER_V4,MAX_INT)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L181)
	State variables written after the call(s):
	- [updateUserDCA(dcaOwner,scheduleId,soldAmount,boughtAmount,currentGasPrice,currentDateTime)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L233-L240)
		- [userGasBalances[dcaOwner] -= gasUsed](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L107)
	- [updateUserDCA(dcaOwner,scheduleId,soldAmount,boughtAmount,currentGasPrice,currentDateTime)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L233-L240)
		- [userToDcaSchedules[dcaOwner][scheduleId].remainingBudget = userToDcaSchedules[dcaOwner][scheduleId].remainingBudget - soldAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L40-L42)
		- [userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[1] = userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2]](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L52)
		- [userToDcaSchedules[dcaOwner][scheduleId].isActive = false](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L62)
		- [userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[2] = currentDateTime + userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L75-L77)
		- [userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[3] = currentDateTime + (userToDcaSchedules[dcaOwner][scheduleId].tradeFrequency * numExec)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L80)
		- [userToDcaSchedules[dcaOwner][scheduleId].scheduleDates[1] = currentDateTime](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L99-L101)
		- [userToDcaSchedules[dcaOwner][scheduleId].soldAmount += soldAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L102)
		- [userToDcaSchedules[dcaOwner][scheduleId].boughtAmount += boughtAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L103)
		- [userToDcaSchedules[dcaOwner][scheduleId].totalGas += gasUsed](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L104)
	- [updateUserDCA(dcaOwner,scheduleId,soldAmount,boughtAmount,currentGasPrice,currentDateTime)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L233-L240)
		- [userTokenBalances[dcaOwner][userToDcaSchedules[dcaOwner][scheduleId].sellToken] = userTokenBalances[dcaOwner][userToDcaSchedules[dcaOwner][scheduleId].sellToken] - soldAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L43-L49)
		- [userTokenBalances[dcaOwner][userToDcaSchedules[dcaOwner][scheduleId].buyToken] = userTokenBalances[dcaOwner][userToDcaSchedules[dcaOwner][scheduleId].buyToken] + boughtAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L90-L96)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-1
[UserScheduleFactory.getFreeGasBalance(uint256).committedGasBal](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L67) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L67


 - [ ] ID-2
[UserBankData.getAllUsersGasBalances().i](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L53) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L53


 - [ ] ID-3
[UserScheduleFactory.getUserAllTokenBalances().i](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L133) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L133


 - [ ] ID-4
[UserScheduleFactory.getFreeTokenBalance(address).i](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L107) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L107


 - [ ] ID-5
[DCAStack.redistrubuteGas().i](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L36) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L36


 - [ ] ID-6
[UserScheduleFactory.getFreeGasBalance(uint256).i](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L69) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L69


 - [ ] ID-7
[UserScheduleData.getAllUsersSchedules().i](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L41) is a local variable never initialized

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L41


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-8
[UserBankData.addUserGasAddress(address)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L45-L47) ignores return value by [_userGasAddresses.add(_user)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L46)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L45-L47


 - [ ] ID-9
[UserScheduleTrade.runUserDCA(address,uint256,uint256,uint256,bytes)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241) ignores return value by [sellToken.approve(AGG_ROUTER_V4,MAX_INT)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L181)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241


 - [ ] ID-10
[UserScheduleData.addUser()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L28-L30) ignores return value by [_userAddresses.add(msg.sender)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L29)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L28-L30


 - [ ] ID-11
[UserScheduleData.removeUserFromSet()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L48-L52) ignores return value by [_userAddresses.remove(msg.sender)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L50)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L48-L52


 - [ ] ID-12
[UserBankData.addUserToken(address,address)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L39-L43) ignores return value by [_userTokens[_user].add(_token)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L41)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L39-L43


## missing-zero-check
Impact: Low
Confidence: Medium
 - [ ] ID-13
[DCAStack.withdrawContractGas(uint256,address).receiver](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L13) lacks a zero-check on :
		- [(success) = receiver.call{value: withdrawAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L23)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L13


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-14
Reentrancy in [UserScheduleBank.depositFunds(address,uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54-L76):
	External calls:
	- [token.safeTransferFrom(msg.sender,address(this),_tokenAmount)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L64)
	State variables written after the call(s):
	- [userTokenBalances[msg.sender][_tokenAddress] = userTokenBalances[msg.sender][_tokenAddress] + depositAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L69-L71)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54-L76


 - [ ] ID-15
Reentrancy in [UserScheduleTrade.runUserDCA(address,uint256,uint256,uint256,bytes)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241):
	External calls:
	- [sellToken.approve(AGG_ROUTER_V4,MAX_INT)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L181)
	State variables written after the call(s):
	- [updateUserDCA(dcaOwner,scheduleId,soldAmount,boughtAmount,currentGasPrice,currentDateTime)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L233-L240)
		- [_status = _ENTERED](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol#L55)
		- [_status = _NOT_ENTERED](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol#L61)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-16
Reentrancy in [UserScheduleBank.withdrawGas(uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L39-L52):
	External calls:
	- [(success) = msg.sender.call{value: _tokenAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L48)
	Event emitted after the call(s):
	- [FundsWithdrawn(msg.sender,ETH,_tokenAmount)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L51)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L39-L52


 - [ ] ID-17
Reentrancy in [UserScheduleTrade.runUserDCA(address,uint256,uint256,uint256,bytes)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241):
	External calls:
	- [sellToken.approve(AGG_ROUTER_V4,MAX_INT)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L181)
	Event emitted after the call(s):
	- [BoughtTokens(scheduleId,u.sellToken,u.buyToken,soldAmount,boughtAmount,u.remainingBudget,u.isActive,gasUsed,remGas,u.scheduleDates[2],dcaOwner)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L113-L125)
		- [updateUserDCA(dcaOwner,scheduleId,soldAmount,boughtAmount,currentGasPrice,currentDateTime)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L233-L240)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241


 - [ ] ID-18
Reentrancy in [UserScheduleBank.depositFunds(address,uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54-L76):
	External calls:
	- [token.safeTransferFrom(msg.sender,address(this),_tokenAmount)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L64)
	Event emitted after the call(s):
	- [FundsDeposited(msg.sender,_tokenAddress,depositAmount)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L75)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54-L76


 - [ ] ID-19
Reentrancy in [UserScheduleBank.withdrawFunds(address,uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78-L105):
	External calls:
	- [(success) = msg.sender.call{value: _tokenAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L92)
	- [SafeERC20.safeTransfer(IERC20(_tokenAddress),msg.sender,_tokenAmount)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L95-L99)
	External calls sending eth:
	- [(success) = msg.sender.call{value: _tokenAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L92)
	Event emitted after the call(s):
	- [FundsWithdrawn(msg.sender,_tokenAddress,_tokenAmount)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L104)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78-L105


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-20
[Address.verifyCallResult(bool,bytes,string)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L201-L221) uses assembly
	- [INLINE ASM](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L213-L216)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L201-L221


 - [ ] ID-21
[EnumerableSet.values(EnumerableSet.UintSet)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L356-L366) uses assembly
	- [INLINE ASM](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L361-L363)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L356-L366


 - [ ] ID-22
[UserScheduleTrade.runUserDCA(address,uint256,uint256,uint256,bytes)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241) uses assembly
	- [INLINE ASM](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L202-L217)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241


 - [ ] ID-23
[EnumerableSet.values(EnumerableSet.AddressSet)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L282-L292) uses assembly
	- [INLINE ASM](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L287-L289)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L282-L292


## boolean-equal
Impact: Informational
Confidence: High
 - [ ] ID-24
[UserScheduleTrade.runUserDCA(address,uint256,uint256,uint256,bytes)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241) compares to a boolean constant:
	-[require(bool,string)(userToDcaSchedules[dcaOwner][scheduleId].isActive == true,Paused!)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L152-L155)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L133-L241


 - [ ] ID-25
[UserScheduleFactory.getFreeTokenBalance(address)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L90-L117) compares to a boolean constant:
	-[allUserSchedules[i].sellToken == _tokenAddress && allUserSchedules[i].isActive == true](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L108)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L90-L117


 - [ ] ID-26
[UserScheduleFactory.getFreeGasBalance(uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L54-L87) compares to a boolean constant:
	-[allUserSchedules[i].isActive == true](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L70)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L54-L87


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-27
Different versions of Solidity are used:
	- Version used: ['^0.8.0', '^0.8.1', '^0.8.9']
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol#L4)
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol#L4)
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4)
	- [^0.8.1](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L4)
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L4)
	- [^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L3)
	- [^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L3)
	- [^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L3)
	- [^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L3)
	- [^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L3)
	- [^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L3)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-28
Pragma version[^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.7

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L3


 - [ ] ID-29
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol#L4


 - [ ] ID-30
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol#L4


 - [ ] ID-31
Pragma version[^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.7

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L3


 - [ ] ID-32
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Context.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Context.sol#L4


 - [ ] ID-33
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol#L4


 - [ ] ID-34
Pragma version[^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.7

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L3


 - [ ] ID-35
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/structs/EnumerableSet.sol#L4


 - [ ] ID-36
Pragma version[^0.8.1](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L4


 - [ ] ID-37
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-38
Pragma version[^0.8.0](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L4) allows old versions

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L4


 - [ ] ID-39
Pragma version[^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.7

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L3


 - [ ] ID-40
Pragma version[^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.7

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L3


 - [ ] ID-41
Pragma version[^0.8.9](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L3) necessitates a version too recent to be trusted. Consider deploying with 0.6.12/0.7.6/0.8.7

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L3


 - [ ] ID-42
solc-0.8.9 is not recommended for deployment

## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-43
Low level call in [UserScheduleBank.withdrawFunds(address,uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78-L105):
	- [(success) = msg.sender.call{value: _tokenAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L92)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78-L105


 - [ ] ID-44
Low level call in [Address.sendValue(address,uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L60-L65):
	- [(success) = recipient.call{value: amount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L63)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L60-L65


 - [ ] ID-45
Low level call in [Address.functionCallWithValue(address,bytes,uint256,string)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L128-L139):
	- [(success,returndata) = target.call{value: value}(data)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L137)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L128-L139


 - [ ] ID-46
Low level call in [DCAStack.withdrawContractGas(uint256,address)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L11-L25):
	- [(success) = receiver.call{value: withdrawAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L23)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/DCAStack.sol#L11-L25


 - [ ] ID-47
Low level call in [Address.functionStaticCall(address,bytes,string)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L157-L166):
	- [(success,returndata) = target.staticcall(data)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L164)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L157-L166


 - [ ] ID-48
Low level call in [Address.functionDelegateCall(address,bytes,string)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L184-L193):
	- [(success,returndata) = target.delegatecall(data)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L191)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/utils/Address.sol#L184-L193


 - [ ] ID-49
Low level call in [UserScheduleBank.withdrawGas(uint256)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L39-L52):
	- [(success) = msg.sender.call{value: _tokenAmount}()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L48)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L39-L52


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-50
Parameter [UserScheduleFactory.pauseSchedule(uint256)._dcaScheduleId](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L27) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L27


 - [ ] ID-51
Parameter [UserScheduleFactory.validateDcaSchedule(address,uint256,uint256,uint256,uint256,uint256)._currGasEstimate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L207) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L207


 - [ ] ID-52
Parameter [UserScheduleFactory.calculateDeposit(uint256,uint256,uint256,uint256,address)._sellToken](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L150) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L150


 - [ ] ID-53
Parameter [UserScheduleFactory.deleteSchedule(uint256)._dcaScheduleId](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L17) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L17


 - [ ] ID-54
Parameter [UserScheduleBank.withdrawFunds(address,uint256)._tokenAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78


 - [ ] ID-55
Parameter [UserScheduleFactory.calculateDeposit(uint256,uint256,uint256,uint256,address)._tradeAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L146) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L146


 - [ ] ID-56
Variable [UserBankData._userGasAddresses](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L19) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L19


 - [ ] ID-57
Parameter [UserScheduleData.calculateExecutions(uint256,uint256,uint256)._startDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L56) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L56


 - [ ] ID-58
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._sellToken](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L226) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L226


 - [ ] ID-59
Parameter [UserScheduleFactory.validateDcaSchedule(address,uint256,uint256,uint256,uint256,uint256)._tradeAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L203) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L203


 - [ ] ID-60
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._startDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L227) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L227


 - [ ] ID-61
Parameter [UserScheduleBank.withdrawFunds(address,uint256)._tokenAddress](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L78


 - [ ] ID-62
Parameter [UserScheduleFactory.validateDcaSchedule(address,uint256,uint256,uint256,uint256,uint256)._sellToken](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L202) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L202


 - [ ] ID-63
Parameter [UserScheduleFactory.validateDcaSchedule(address,uint256,uint256,uint256,uint256,uint256)._startDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L205) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L205


 - [ ] ID-64
Parameter [UserScheduleFactory.calculateGasDeposit(uint256,uint256,uint256,uint256)._tradeAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L174) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L174


 - [ ] ID-65
Parameter [UserScheduleData.calculateExecutions(uint256,uint256,uint256)._endDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L57) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L57


 - [ ] ID-66
Parameter [UserBankData.addUserToken(address,address)._token](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L39) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L39


 - [ ] ID-67
Parameter [UserScheduleFactory.validateDcaSchedule(address,uint256,uint256,uint256,uint256,uint256)._endDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L206) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L206


 - [ ] ID-68
Parameter [UserScheduleFactory.calculateDeposit(uint256,uint256,uint256,uint256,address)._startDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L148) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L148


 - [ ] ID-69
Parameter [UserScheduleBank.depositFunds(address,uint256)._tokenAddress](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54


 - [ ] ID-70
Parameter [UserScheduleFactory.calculateGasDeposit(uint256,uint256,uint256,uint256)._tradeFrequency](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L175) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L175


 - [ ] ID-71
Parameter [UserScheduleData.calculateExecutions(uint256,uint256,uint256)._tradeFrequency](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L55) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L55


 - [ ] ID-72
Parameter [UserBankData.addUserToken(address,address)._user](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L39) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L39


 - [ ] ID-73
Parameter [UserScheduleFactory.calculateDeposit(uint256,uint256,uint256,uint256,address)._tradeFrequency](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L147) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L147


 - [ ] ID-74
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._tradeFrequency](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L223) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L223


 - [ ] ID-75
Parameter [UserScheduleBank.withdrawGas(uint256)._tokenAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L39) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L39


 - [ ] ID-76
Function [IERC20Permit.DOMAIN_SEPARATOR()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol#L59) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol#L59


 - [ ] ID-77
Parameter [UserScheduleFactory.calculateDeposit(uint256,uint256,uint256,uint256,address)._endDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L149) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L149


 - [ ] ID-78
Parameter [UserScheduleBank.depositFunds(address,uint256)._tokenAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleBank.sol#L54


 - [ ] ID-79
Parameter [UserBankData.addUserGasAddress(address)._user](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L45) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L45


 - [ ] ID-80
Parameter [UserScheduleFactory.resumeSchedule(uint256,uint256)._dcaScheduleId](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L31) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L31


 - [ ] ID-81
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._endDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L228) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L228


 - [ ] ID-82
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._buyToken](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L225) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L225


 - [ ] ID-83
Variable [UserScheduleData._userAddresses](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L26) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleData.sol#L26


 - [ ] ID-84
Variable [UserBankData._userTokens](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L17) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserBankData.sol#L17


 - [ ] ID-85
Parameter [UserScheduleFactory.calculateGasDeposit(uint256,uint256,uint256,uint256)._startDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L176) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L176


 - [ ] ID-86
Parameter [UserScheduleFactory.getFreeTokenBalance(address)._tokenAddress](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L90) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L90


 - [ ] ID-87
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._currGasEstimate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L229) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L229


 - [ ] ID-88
Variable [UserScheduleTrade.MAX_INT](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L13-L14) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L13-L14


 - [ ] ID-89
Parameter [UserScheduleFactory.calculateGasDeposit(uint256,uint256,uint256,uint256)._endDate](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L177) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L177


 - [ ] ID-90
Parameter [UserScheduleFactory.createDcaSchedule(uint256,uint256,address,address,uint256,uint256,uint256)._tradeAmount](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L224) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L224


 - [ ] ID-91
Parameter [UserScheduleFactory.validateDcaSchedule(address,uint256,uint256,uint256,uint256,uint256)._tradeFrequency](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L204) is not in mixedCase

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleFactory.sol#L204


## constable-states
Impact: Optimization
Confidence: High
 - [ ] ID-92
[UserScheduleTrade.MAX_INT](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L13-L14) should be constant

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/contracts/UserScheduleTrade.sol#L13-L14


## external-function
Impact: Optimization
Confidence: High
 - [ ] ID-93
renounceOwnership() should be declared external:
	- [Ownable.renounceOwnership()](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L61-L63)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L61-L63


 - [ ] ID-94
transferOwnership(address) should be declared external:
	- [Ownable.transferOwnership(address)](https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L69-L72)

https://github.com/Shazman96/DCAStackDefi-Contracts/blob/main/node_modules/@openzeppelin/contracts/access/Ownable.sol#L69-L72


