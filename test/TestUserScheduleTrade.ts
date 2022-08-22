import { ethers } from "hardhat";
import { expect } from "chai";
import { IERC20, DCAStack } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ETH_ADDRESS,
  DAI_ADDRESS,
  WETH_ADDRESS,
  getTokenFromFaucet,
  DAI_CHECKSUM,
  WETH_CHECKSUM
} from "./FaucetHelpers";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";

// Agg calldata for transfering 100 DAI to WETH
const daiToWethCallData =
  "0x2e95b6c80000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000000002cc11fa6b521e30000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000003b6d0340c3d03e4f041fd4cd388c549ee2a29a9e5075882fcfee7c08";

// Agg calldata for transfering 100 DAI to ETH
const daiToEthCallData =
  "0x2e95b6c80000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000000002bf5e837c7b7fc0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000140000000000000003b6d0340c3d03e4f041fd4cd388c549ee2a29a9e5075882fcfee7c08";

// Agg calldata fro transfering 100 ETH to DAI
const ethtoDaiCallData =
  "0xe449022e0000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000002a48bd487f28b7740a9f00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000088e6a0c2ddd26feeb64f039a2c41296fcb3f56408000000000000000000000005777d92f208679db4b9778590fa3cab3ac9e2168cfee7c08";

// create new schedules
const startDate = Math.floor(new Date().getTime() / 1000); //get current
const currentDateTime = Math.floor(new Date().getTime() / 1000);
const tradeAmount = ethers.utils.parseEther("100");
const tradeFreq = 1 * 86400; // trade daily
const endDate = Math.floor(new Date().getTime() / 1000) + 86400; //add 1 day

describe("UserScheduleTrade Test Suite", function () {
  let DCAStack;
  let hhUserScheduleTrade: DCAStack;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let DAI_IERC20: IERC20;
  let WETH_IERC20: IERC20;

  beforeEach(async function () {
    DAI_IERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
    WETH_IERC20 = await ethers.getContractAt("IERC20", WETH_ADDRESS);

    DCAStack = await ethers.getContractFactory("DCAStack");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    hhUserScheduleTrade = await DCAStack.deploy();

    // get DAI for addr1
    await getTokenFromFaucet(
      DAI_ADDRESS,
      addr1.address,
      ethers.utils.parseEther("500")
    );

    // approve DAI for addr2
    await DAI_IERC20.connect(addr2).approve(
      hhUserScheduleTrade.address,
      ethers.utils.parseEther("999")
    );

    // setup schedules for user 1
    const depositAmount = ethers.utils.parseEther("1");

    await hhUserScheduleTrade
      .connect(addr1)
      .depositGas({ value: depositAmount });

    // ETH to buy DAI schedule 0
    await hhUserScheduleTrade
      .connect(addr1)
      .depositFunds(ETH_ADDRESS, tradeAmount, { value: tradeAmount });

    await hhUserScheduleTrade
      .connect(addr1)
      .createDcaSchedule(
        tradeFreq,
        tradeAmount,
        DAI_ADDRESS,
        ETH_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

    // DAI to buy WETH schedule 1
    await DAI_IERC20.connect(addr1).approve(
      hhUserScheduleTrade.address,
      ethers.utils.parseEther("999")
    );

    await hhUserScheduleTrade
      .connect(addr1)
      .depositFunds(DAI_ADDRESS, tradeAmount);

    await hhUserScheduleTrade
      .connect(addr1)
      .createDcaSchedule(
        tradeFreq,
        tradeAmount,
        WETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

    // DAI to buy ETH schedule 2
    await hhUserScheduleTrade
      .connect(addr1)
      .depositFunds(DAI_ADDRESS, tradeAmount);

    await hhUserScheduleTrade
      .connect(addr1)
      .createDcaSchedule(
        tradeFreq,
        tradeAmount,
        ETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );
  });

  //TODO
  describe("Update User DCA Details", function () {

    it("Should update after swap sold less than amount", async function () { });

    it("Should update after swap used more gas than available", async function () { });


  });

  describe("Swap ETH to Token", function () {

    it("Should swap ETH to DAI single run complete", async function () {
      const initialEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        0,
        1,
        currentDateTime,
        ethtoDaiCallData,
        {
          value: ethers.utils.parseEther("100"),
        }
      );

      const finalEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(finalDaiBalance).gt(initialDaiBalance);
      expect(initialEthBalance).gt(finalEthBalance);
      expect(finalDaiContractBalance).gt(initialContractDaiBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = finalDaiBalance.sub(initialDaiBalance);
      const ethBalDiff = initialEthBalance.sub(finalEthBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          0,
          ETH_ADDRESS,
          DAI_CHECKSUM,
          ethBalDiff,
          daiBalDiff,
          0,
          false,
          1,
          finalGasBalance,
          startDate,
          addr1.address
        );

      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let EthToDaiSchedule = userSchedules[0];
      expect(EthToDaiSchedule.remainingBudget).to.equal(0);
      expect(EthToDaiSchedule.isActive).to.equal(false);
      expect(EthToDaiSchedule.scheduleDates[0]).to.equal(startDate);
      expect(EthToDaiSchedule.scheduleDates[1]).to.equal(startDate);
      expect(EthToDaiSchedule.scheduleDates[2]).to.equal(startDate);
      expect(EthToDaiSchedule.scheduleDates[3]).to.equal(endDate);
      expect(EthToDaiSchedule.soldAmount).to.equal(ethBalDiff);
      expect(EthToDaiSchedule.boughtAmount).to.equal(daiBalDiff);
      expect(EthToDaiSchedule.totalGas).to.equal(BigNumber.from(1));

      await expect(hhUserScheduleTrade
        .connect(addr1).resumeSchedule(0, BigNumber.from(1))).to.be.reverted;

    });

    it("Should swap ETH to DAI multiple trades pending", async function () {

      const tradeAmount = ethers.utils.parseEther("100");
      const depositAmount = ethers.utils.parseEther("200");
      const endDate = currentDateTime + (86400 * 2); //add 2 days
      const scheduleNum = 3; //since we're adding 4th schedule

      await hhUserScheduleTrade
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      //4th schedule
      await hhUserScheduleTrade
        .connect(addr1)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          DAI_ADDRESS,
          ETH_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      const initialEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        ethtoDaiCallData,
        {
          value: tradeAmount,
        }
      );

      const finalEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(finalDaiBalance).gt(initialDaiBalance);
      expect(initialEthBalance).gt(finalEthBalance);
      expect(finalDaiContractBalance).gt(initialContractDaiBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = finalDaiBalance.sub(initialDaiBalance);
      const ethBalDiff = initialEthBalance.sub(finalEthBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          scheduleNum,
          ETH_ADDRESS,
          DAI_CHECKSUM,
          ethBalDiff,
          daiBalDiff,
          ethers.utils.parseEther("100"),
          true,
          1,
          finalGasBalance,
          startDate + tradeFreq,
          addr1.address
        );


      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let EthToDaiSchedule = userSchedules[scheduleNum];
      expect(EthToDaiSchedule.remainingBudget).to.equal(ethers.utils.parseEther("100"));
      expect(EthToDaiSchedule.isActive).to.equal(true);
      expect(EthToDaiSchedule.scheduleDates[0]).to.equal(startDate);
      expect(EthToDaiSchedule.scheduleDates[1]).to.equal(startDate);
      expect(EthToDaiSchedule.scheduleDates[2]).to.equal(startDate + tradeFreq);
      expect(EthToDaiSchedule.scheduleDates[3]).to.equal(endDate);
      expect(EthToDaiSchedule.soldAmount).to.equal(ethBalDiff);
      expect(EthToDaiSchedule.boughtAmount).to.equal(daiBalDiff);
      expect(EthToDaiSchedule.totalGas).to.equal(BigNumber.from(1));

    });


  });

  describe("Swap token to Token", function () {

    it("Should swap DAI to WETH single run", async function () {
      const initialWethBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractWethBalance = await WETH_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        1,
        1,
        currentDateTime,
        daiToWethCallData
      );

      const finalWethBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalWethContractBalance = await WETH_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalWethBalance).gt(initialWethBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(finalWethContractBalance).gt(initialContractWethBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const wethBalDiff = finalWethBalance.sub(initialWethBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          1,
          DAI_CHECKSUM,
          WETH_CHECKSUM,
          daiBalDiff,
          wethBalDiff,
          0,
          false,
          1,
          finalGasBalance,
          startDate,
          addr1.address
        );

      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let DaiToWeth = userSchedules[1];
      expect(DaiToWeth.remainingBudget).to.equal(0);
      expect(DaiToWeth.isActive).to.equal(false);
      expect(DaiToWeth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[2]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToWeth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToWeth.boughtAmount).to.equal(wethBalDiff);
      expect(DaiToWeth.totalGas).to.equal(BigNumber.from(1));

      await expect(hhUserScheduleTrade
        .connect(addr1).resumeSchedule(1, BigNumber.from(1))).to.be.reverted;

    });


    it("Should swap DAI to WETH multi run pending", async function () {

      const tradeAmount = ethers.utils.parseEther("100");
      const depositAmount = ethers.utils.parseEther("200");
      const endDate = currentDateTime + (86400 * 2); //add 2 days
      const scheduleNum = 3; //since we're adding 4th schedule

      await hhUserScheduleTrade
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      //4th schedule
      await hhUserScheduleTrade
        .connect(addr1)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          WETH_ADDRESS,
          DAI_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      const initialWethBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractWethBalance = await WETH_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        daiToWethCallData
      );

      const finalWethBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalWethContractBalance = await WETH_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalWethBalance).gt(initialWethBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(finalWethContractBalance).gt(initialContractWethBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const wethBalDiff = finalWethBalance.sub(initialWethBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          WETH_CHECKSUM,
          daiBalDiff,
          wethBalDiff,
          ethers.utils.parseEther("100"),
          true,
          1,
          finalGasBalance,
          currentDateTime + tradeFreq,
          addr1.address
        );


      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let DaiToWeth = userSchedules[scheduleNum];
      expect(DaiToWeth.remainingBudget).to.equal(ethers.utils.parseEther("100"));
      expect(DaiToWeth.isActive).to.equal(true);
      expect(DaiToWeth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[2]).to.equal(startDate + tradeFreq);
      expect(DaiToWeth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToWeth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToWeth.boughtAmount).to.equal(wethBalDiff);
      expect(DaiToWeth.totalGas).to.equal(BigNumber.from(1));
    });

  });

  describe("Swap token to ETH", function () {

    it("Should swap DAI to ETH single run", async function () {

      const scheduleNum = 2;

      const initialEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        daiToEthCallData
      );

      const finalEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalEthBalance).gt(initialEthBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const ethBalDiff = finalEthBalance.sub(initialEthBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          ETH_ADDRESS,
          daiBalDiff,
          ethBalDiff,
          0,
          false,
          1,
          finalGasBalance,
          startDate,
          addr1.address
        );

      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.remainingBudget).to.equal(0);
      expect(DaiToEth.isActive).to.equal(false);
      expect(DaiToEth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[2]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToEth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToEth.boughtAmount).to.equal(ethBalDiff);
      expect(DaiToEth.totalGas).to.equal(BigNumber.from(1));

      await expect(hhUserScheduleTrade
        .connect(addr1).resumeSchedule(0, BigNumber.from(scheduleNum))).to.be.reverted;
    });

    it("Should swap DAI to ETH multi run pending", async function () {

      const tradeAmount = ethers.utils.parseEther("100");
      const depositAmount = ethers.utils.parseEther("200");
      const endDate = currentDateTime + (86400 * 2); //add 2 days
      const scheduleNum = 3; //since we're adding 4th schedule

      await hhUserScheduleTrade
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      //4th schedule
      await hhUserScheduleTrade
        .connect(addr1)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          ETH_ADDRESS,
          DAI_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      const initialEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        daiToEthCallData
      );

      const finalEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalEthBalance).gt(initialEthBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const ethBalDiff = finalEthBalance.sub(initialEthBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          ETH_ADDRESS,
          daiBalDiff,
          ethBalDiff,
          ethers.utils.parseEther("100"),
          true,
          1,
          finalGasBalance,
          currentDateTime + tradeFreq,
          addr1.address
        );

      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.remainingBudget).to.equal(ethers.utils.parseEther("100"));
      expect(DaiToEth.isActive).to.equal(true);
      expect(DaiToEth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[2]).to.equal(startDate + tradeFreq);
      expect(DaiToEth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToEth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToEth.boughtAmount).to.equal(ethBalDiff);
      expect(DaiToEth.totalGas).to.equal(BigNumber.from(1));

    });

  });


  describe("Swap after user resumes schedule", function () {

    it("Should swap DAI to ETH multi run pending after resume", async function () {

      const tradeAmount = ethers.utils.parseEther("100");
      const depositAmount = ethers.utils.parseEther("300");
      const startDateTest = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDateTest = startDateTest + (86400 * 3); //add 2 days
      const scheduleNum = 3; //since we're adding 4th schedule

      await hhUserScheduleTrade
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      //4th schedule
      await hhUserScheduleTrade
        .connect(addr1)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          ETH_ADDRESS,
          DAI_ADDRESS,
          startDateTest,
          endDateTest,
          BigNumber.from(1)
        );

      const initialEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const initialGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      const tx = await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        startDateTest,
        daiToEthCallData
      );

      const finalEthBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await hhUserScheduleTrade.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        hhUserScheduleTrade.address
      );
      const finalGasBalance = await hhUserScheduleTrade.userGasBalances(
        addr1.address
      );

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalEthBalance).gt(initialEthBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const ethBalDiff = finalEthBalance.sub(initialEthBalance)

      await expect(tx).to.emit(hhUserScheduleTrade, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          ETH_ADDRESS,
          daiBalDiff,
          ethBalDiff,
          ethers.utils.parseEther("200"),
          true,
          1,
          finalGasBalance,
          startDateTest + tradeFreq,
          addr1.address
        );

      let userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      let DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.remainingBudget).to.equal(ethers.utils.parseEther("200"));
      expect(DaiToEth.isActive).to.equal(true);
      expect(DaiToEth.scheduleDates[0]).to.equal(startDateTest);
      expect(DaiToEth.scheduleDates[1]).to.equal(startDateTest);
      expect(DaiToEth.scheduleDates[2]).to.equal(startDateTest + tradeFreq);
      expect(DaiToEth.scheduleDates[3]).to.equal(endDateTest);
      expect(DaiToEth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToEth.boughtAmount).to.equal(ethBalDiff);
      expect(DaiToEth.totalGas).to.equal(BigNumber.from(1));

      hhUserScheduleTrade
        .connect(addr1).pauseSchedule(scheduleNum);

      userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.isActive).to.equal(false);

      await expect(hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        daiToEthCallData
      )).to.be.reverted;

      hhUserScheduleTrade
        .connect(addr1).resumeSchedule(scheduleNum, 1);

      userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.isActive).to.equal(true);

      await hhUserScheduleTrade.runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        daiToEthCallData
      );

      userSchedules = await hhUserScheduleTrade
        .connect(addr1).getUserSchedules();
      DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.isActive).to.equal(true);
      expect(DaiToEth.scheduleDates[0]).to.equal(startDateTest);
      expect(DaiToEth.scheduleDates[1]).to.equal(currentDateTime);
      expect(DaiToEth.scheduleDates[2]).to.equal(currentDateTime + tradeFreq);
      expect(DaiToEth.scheduleDates[3]).to.equal(currentDateTime + (tradeFreq * 2));
      expect(DaiToEth.soldAmount).to.equal(parseEther("200"));
      // expect(DaiToEth.boughtAmount).to.equal(ethBalDiff);
      expect(DaiToEth.totalGas).to.equal(BigNumber.from(2));

    });

  });


  describe("Swap invalid scenarios", function () {


    it("Should not swap due to low gas balance", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await hhUserScheduleTrade
        .connect(addr2)
        .depositFunds(DAI_ADDRESS, tradeAmount);

      await hhUserScheduleTrade.connect(addr2).depositGas({ value: 1 });

      await hhUserScheduleTrade
        .connect(addr2)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          ETH_ADDRESS,
          DAI_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      await expect(
        hhUserScheduleTrade.runUserDCA(
          addr2.address,
          0,
          1,
          currentDateTime,
          daiToEthCallData
        )
      ).to.be.reverted;
    });

    it("Should not swap due to low token balance", async function () {

      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await hhUserScheduleTrade
        .connect(addr2)
        .depositFunds(DAI_ADDRESS, tradeAmount);

      const ethAmount = ethers.utils.parseEther("1");
      await hhUserScheduleTrade.connect(addr2).depositGas({ value: ethAmount });

      await hhUserScheduleTrade
        .connect(addr2)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          ETH_ADDRESS,
          DAI_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      await hhUserScheduleTrade
        .connect(addr2)
        .withdrawFunds(DAI_ADDRESS, tradeAmount);

      await expect(
        hhUserScheduleTrade.runUserDCA(
          addr2.address,
          0,
          1,
          currentDateTime,
          daiToEthCallData
        )
      ).to.be.reverted;

    });

    it("Should not swap due to paused schedule", async function () {

      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await hhUserScheduleTrade
        .connect(addr2)
        .depositFunds(DAI_ADDRESS, tradeAmount);

      const ethAmount = ethers.utils.parseEther("1");
      await hhUserScheduleTrade.connect(addr2).depositGas({ value: ethAmount });

      await hhUserScheduleTrade
        .connect(addr2)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          ETH_ADDRESS,
          DAI_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      await expect(
        hhUserScheduleTrade.runUserDCA(
          addr2.address,
          0,
          1,
          endDate,
          daiToEthCallData
        )
      ).to.not.be.reverted;

      //reverts because schedule concluded
      await expect(
        hhUserScheduleTrade.runUserDCA(
          addr2.address,
          0,
          1,
          endDate,
          daiToEthCallData
        )
      ).to.be.reverted;

    });

    it("Should not swap due to not ready time", async function () {

      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await hhUserScheduleTrade
        .connect(addr2)
        .depositFunds(DAI_ADDRESS, tradeAmount);

      const ethAmount = ethers.utils.parseEther("1");
      await hhUserScheduleTrade.connect(addr2).depositGas({ value: ethAmount });

      await hhUserScheduleTrade
        .connect(addr2)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          ETH_ADDRESS,
          DAI_ADDRESS,
          startDate,
          endDate,
          BigNumber.from(1)
        );

      await expect(
        hhUserScheduleTrade.runUserDCA(
          addr2.address,
          0,
          1,
          startDate - 1,
          daiToEthCallData
        )
      ).to.be.reverted;

    });
  });

});
