//SPDX-License-Identifier: GNU AGPLv3

pragma solidity ^0.8.9;

import "./UserBankData.sol";
import "./UserScheduleData.sol";

//create new user schedule and validate
contract UserScheduleFactory is UserBankData, UserScheduleData {
    event NewUserSchedule(
        uint256 indexed dcaScheduleId,
        address buyToken,
        address sellToken,
        address indexed dcaOwner
    );

    function deleteSchedule(uint256 _dcaScheduleId) external {
        delete userToDcaSchedules[msg.sender][_dcaScheduleId];
        userToDcaSchedules[msg.sender][_dcaScheduleId] = userToDcaSchedules[
            msg.sender
        ][userToDcaSchedules[msg.sender].length - 1];
        userToDcaSchedules[msg.sender].pop();

        removeUserFromSet();
    }

    function pauseSchedule(uint256 _dcaScheduleId) external {
        userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = false;
    }

    function resumeSchedule(uint256 _dcaScheduleId, uint256 currGasEstimate)
        external
    {
        require(
            userToDcaSchedules[msg.sender][_dcaScheduleId].remainingBudget > 0,
            "Schedule complete!"
        );

        validateDcaSchedule(
            userToDcaSchedules[msg.sender][_dcaScheduleId].sellToken,
            userToDcaSchedules[msg.sender][_dcaScheduleId].tradeAmount,
            userToDcaSchedules[msg.sender][_dcaScheduleId].tradeFrequency,
            userToDcaSchedules[msg.sender][_dcaScheduleId].scheduleDates[2], //nextRun
            userToDcaSchedules[msg.sender][_dcaScheduleId].scheduleDates[3], //endDate
            currGasEstimate
        );

        userToDcaSchedules[msg.sender][_dcaScheduleId].isActive = true;
    }

    function getUserSchedules() public view returns (DcaSchedule[] memory) {
        return userToDcaSchedules[msg.sender];
    }

    //get gas deposited not in use by schedules (excludes paused)
    function getFreeGasBalance(uint256 currGasEstimate)
        public
        view
        returns (int256)
    {
        DcaSchedule[] memory allUserSchedules = getUserSchedules();

        int256 totalGasDeposit = int256(userGasBalances[msg.sender]);
        int256 freeGasBal;

        if (allUserSchedules.length == 0) {
            freeGasBal = totalGasDeposit;
        } else {
            int256 committedGasBal;

            for (uint256 i; i < allUserSchedules.length; i++) {
                if (allUserSchedules[i].isActive == true) {
                    uint256 remExec = calculateExecutions(
                        allUserSchedules[i].tradeFrequency,
                        allUserSchedules[i].scheduleDates[2],
                        allUserSchedules[i].scheduleDates[3]
                        //startDate, lastRun, nextRun, endDate
                    );

                    committedGasBal += int256(remExec * currGasEstimate);
                }
            }

            freeGasBal = totalGasDeposit - committedGasBal;
        }

        return freeGasBal;
    }

    //get funds deposited not in use by schedules (excludes paused)
    function getFreeTokenBalance(address _tokenAddress)
        public
        view
        returns (int256)
    {
        DcaSchedule[] memory allUserSchedules = getUserSchedules();

        int256 totalUserDeposit = int256(
            userTokenBalances[msg.sender][_tokenAddress]
        );
        int256 freeDepositBal = 0;

        if (allUserSchedules.length == 0) {
            freeDepositBal = totalUserDeposit;
        } else {
            int256 committedBal = 0;

            for (uint256 i; i < allUserSchedules.length; i++) {
                if (
                    allUserSchedules[i].sellToken == _tokenAddress &&
                    allUserSchedules[i].isActive == true
                ) {
                    committedBal += int256(allUserSchedules[i].remainingBudget);
                }
            }

            freeDepositBal = totalUserDeposit - committedBal;
        }

        return freeDepositBal;
    }

    function getUserAllTokenBalances()
        external
        view
        returns (
            address[] memory,
            uint256[] memory,
            int256[] memory
        )
    {
        uint256 length = getUserTokensLength();
        address[] memory retrieveUserTokens = new address[](length);
        uint256[] memory retrieveUserBalances = new uint256[](length);
        int256[] memory retrieveFreeBalances = new int256[](length);

        for (uint256 i; i < length; i++) {
            retrieveUserTokens[i] = getUserTokenAddressAt(i);
            retrieveUserBalances[i] = userTokenBalances[msg.sender][
                retrieveUserTokens[i]
            ];
            retrieveFreeBalances[i] = getFreeTokenBalance(
                retrieveUserTokens[i]
            );
        }
        return (retrieveUserTokens, retrieveUserBalances, retrieveFreeBalances);
    }

    function calculateDeposit(
        uint256 _tradeAmount,
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate,
        address _sellToken
    ) public view returns (uint256) {
        uint256 totalExecutions = calculateExecutions(
            _tradeFrequency,
            _startDate,
            _endDate
        );

        require(totalExecutions > 0, "Invalid!");
        require(_tradeAmount > 0, "Not 0!");

        int256 totalBudget = int256(_tradeAmount * totalExecutions);
        int256 gotFreeTokenBalance = getFreeTokenBalance(_sellToken);

        uint256 neededDeposit = 0;

        if (totalBudget - gotFreeTokenBalance > 0) {
            neededDeposit = uint256(totalBudget - gotFreeTokenBalance);
        }

        return neededDeposit;
    }

    function calculateGasDeposit(
        uint256 _tradeAmount,
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate
    ) public view returns (uint256) {
        uint256 totalExecutions = calculateExecutions(
            _tradeFrequency,
            _startDate,
            _endDate
        );

        require(totalExecutions > 0, "Invalid!");
        require(_tradeAmount > 0, "Not 0!");

        int256 totalBudget = int256(_tradeAmount * totalExecutions);
        int256 gotFreeGasBalance = getFreeGasBalance(_tradeAmount);

        uint256 neededDeposit = 0;

        if (totalBudget - gotFreeGasBalance > 0) {
            neededDeposit = uint256(totalBudget - gotFreeGasBalance);
        }

        return neededDeposit;
    }

    //validate schedule before creation
    function validateDcaSchedule(
        address _sellToken,
        uint256 _tradeAmount,
        uint256 _tradeFrequency,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _currGasEstimate
    ) public view {
        uint256 needAmount = calculateDeposit(
            _tradeAmount,
            _tradeFrequency,
            _startDate,
            _endDate,
            _sellToken
        );
        require(needAmount == 0, "Low bal!");

        uint256 needGasAmount = calculateGasDeposit(
            _currGasEstimate,
            _tradeFrequency,
            _startDate,
            _endDate
        );
        require(needGasAmount == 0, "Low gas!");
    }

    function createDcaSchedule(
        uint256 _tradeFrequency,
        uint256 _tradeAmount,
        address _buyToken,
        address _sellToken,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _currGasEstimate
    ) external {
        uint256 totalExec = calculateExecutions(
            _tradeFrequency,
            _startDate,
            _endDate
        );
        uint256 totalBudget = _tradeAmount * totalExec;

        validateDcaSchedule(
            _sellToken,
            _tradeAmount,
            _tradeFrequency,
            _startDate,
            _endDate,
            _currGasEstimate
        );

        addUser();
        addUserToken(msg.sender, _buyToken);

        userToDcaSchedules[msg.sender].push(
            DcaSchedule(
                _tradeFrequency,
                _tradeAmount,
                totalBudget,
                _buyToken,
                _sellToken,
                true,
                [_startDate, 0, _startDate, _endDate],
                0,
                0,
                0
            )
        );

        emit NewUserSchedule(
            userToDcaSchedules[msg.sender].length - 1,
            _buyToken,
            _sellToken,
            msg.sender
        );
    }
}
