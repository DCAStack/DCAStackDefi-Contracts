import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DCAStack, IERC20 } from "../typechain";
import { BigNumber } from "ethers";
import {
  getTokenFromFaucet,
  ETH_ADDRESS,
  DAI_ADDRESS,
  DAI_CHECKSUM,
} from "./FaucetHelpers";

describe("UserScheduleFactory Test Suite", function () {
  let DCAStack;
  let hardhatUserScheduleFactory: DCAStack;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let dai: IERC20;

  beforeEach(async function () {
    DCAStack = await ethers.getContractFactory(
      "DCAStack"
    );
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    hardhatUserScheduleFactory = await DCAStack.deploy();
    dai = <IERC20>await ethers.getContractAt("IERC20", DAI_ADDRESS);
  });

  describe("Schedule Helper Free Gas Balances", function () {
    it("Should calculate free gas balance no schedules", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(depositAmount);

    });

    it("Should calculate free gas balance with active schedule", async function () {

      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            DAI_ADDRESS,
            ETH_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(ethers.utils.parseEther("0.01"));
      expect(userDepositedBal).to.eq(depositAmount.sub(ethers.utils.parseEther("0.07")));

    });

    it("Should calculate free gas balance with paused schedule", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            DAI_ADDRESS,
            ETH_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1).pauseSchedule(0);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(ethers.utils.parseEther("0.01"));
      expect(userDepositedBal).to.eq(depositAmount);

    });

    it("Should calculate free gas balance negative case", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(0);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            DAI_ADDRESS,
            ETH_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1).withdrawGas(depositAmount);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeGasBalance(ethers.utils.parseEther("0.01"));
      expect(userDepositedBal).to.eq(ethers.utils.parseEther("-0.07"));
    });

  });

  describe("Schedule Helper Free Token Balances", function () {

    it("Should calculate free token balance ETH with active schedule", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            DAI_ADDRESS,
            ETH_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount.sub(ethers.utils.parseEther("0.07")));
    });

    it("Should calculate free token balance ETH with paused schedule", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            DAI_ADDRESS,
            ETH_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1).pauseSchedule(0);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);
    });

    it("Should calculate free token balance ETH negative case", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            DAI_ADDRESS,
            ETH_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;
      hardhatUserScheduleFactory
        .connect(addr1).withdrawFunds(ETH_ADDRESS, depositAmount);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(ethers.utils.parseEther("-0.07"));
    });

    it("Should calculate free token balance ETH no schedules", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      expect(
        await hardhatUserScheduleFactory
          .connect(addr2)
          .getFreeTokenBalance(ETH_ADDRESS)
      ).to.eq(0);
    });

    it("Should calculate free token balance DAI with active schedule", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      await getTokenFromFaucet(DAI_ADDRESS, addr1.address, depositAmount);
      await dai
        .connect(addr1)
        .approve(hardhatUserScheduleFactory.address, depositAmount);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            ETH_ADDRESS,
            DAI_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount.sub(ethers.utils.parseEther("0.07")));
    });

    it("Should calculate free token balance DAI with paused schedule", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      await getTokenFromFaucet(DAI_ADDRESS, addr1.address, depositAmount);
      await dai
        .connect(addr1)
        .approve(hardhatUserScheduleFactory.address, depositAmount);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            ETH_ADDRESS,
            DAI_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1).pauseSchedule(0);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);
    });

    it("Should calculate free token balance DAI negative case", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      await getTokenFromFaucet(DAI_ADDRESS, addr1.address, depositAmount);
      await dai
        .connect(addr1)
        .approve(hardhatUserScheduleFactory.address, depositAmount);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount, { value: depositAmount });

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: depositAmount });

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            86400,
            ethers.utils.parseEther("0.01"),
            ETH_ADDRESS,
            DAI_ADDRESS,
            new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000,
            new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000,
            ethers.utils.parseEther("0.01")
          )
      ).to.not.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1).withdrawFunds(DAI_ADDRESS, depositAmount);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(ethers.utils.parseEther("-0.07"));
    });

    it("Should calculate free token balance DAI no schedules", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      await getTokenFromFaucet(DAI_ADDRESS, addr1.address, depositAmount);
      await dai
        .connect(addr1)
        .approve(hardhatUserScheduleFactory.address, depositAmount);

      let userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      userDepositedBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedBal).to.eq(depositAmount);

      expect(
        await hardhatUserScheduleFactory
          .connect(addr2)
          .getFreeTokenBalance(DAI_ADDRESS)
      ).to.eq(0);
    });

    it("Should calculate free token balance multiasset", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      await getTokenFromFaucet(DAI_ADDRESS, addr1.address, depositAmount);
      await dai
        .connect(addr1)
        .approve(hardhatUserScheduleFactory.address, depositAmount);

      let userDepositedEthBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedEthBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, depositAmount, { value: depositAmount });

      userDepositedEthBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(ETH_ADDRESS);
      expect(userDepositedEthBal).to.eq(depositAmount);

      expect(
        await hardhatUserScheduleFactory
          .connect(addr2)
          .getFreeTokenBalance(ETH_ADDRESS)
      ).to.eq(0);

      let userDepositedDaiBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedDaiBal).to.eq(0);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, depositAmount);

      userDepositedDaiBal = await hardhatUserScheduleFactory
        .connect(addr1)
        .getFreeTokenBalance(DAI_ADDRESS);
      expect(userDepositedDaiBal).to.eq(depositAmount);

      expect(
        await hardhatUserScheduleFactory
          .connect(addr2)
          .getFreeTokenBalance(DAI_ADDRESS)
      ).to.eq(0);
    });
  });

  describe("Schedule Helper Executions", function () {
    it("Should calculate total executions every day", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 1 * 86400; //every day

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(7);
    });

    it("Should calculate total executions on days every 5 days", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 5 * 86400; //every 5 days

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(1);
    });

    it("Should calculate total executions on days every 7 days", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 7 * 86400; //every 7 days

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(1);
    });

    it("Should calculate total executions on hours every hour", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 1 * 3600; //every hour

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(168);
    });

    it("Should calculate total executions on hours every 24 hours", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 24 * 3600; //every 24 hours

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(7);
    });

    it("Should calculate total executions on minutes every minute", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 1 * 60; //every minute

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(10080);
    });

    it("Should calculate total executions on minutes every 60 minutes", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 60 * 60; //every 60 minutes

      const totalExc = await hardhatUserScheduleFactory.calculateExecutions(
        tradeFrequency,
        startDate,
        endDate
      );
      expect(totalExc).to.eq(168);
    });

    it("Should NOT calculate total executions invalid date", async function () {
      const startDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 1 * 86400; //every day

      await expect(
        hardhatUserScheduleFactory.calculateExecutions(
          tradeFrequency,
          startDate,
          endDate
        )
      ).to.be.reverted;
    });

    it("Should NOT calculate total executions invalid frequency", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 0; //every 60 minutes

      await expect(
        hardhatUserScheduleFactory.calculateExecutions(
          tradeFrequency,
          startDate,
          endDate
        )
      ).to.be.reverted;
    });

    it("Should NOT calculate total executions invalid duration", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = -60; //every 60 minutes

      await expect(
        hardhatUserScheduleFactory.calculateExecutions(
          tradeFrequency,
          startDate,
          endDate
        )
      ).to.be.reverted;
    });

    it("Should NOT calculate total executions invalid executions", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFrequency = 100 * 86400;

      await expect(
        hardhatUserScheduleFactory.calculateExecutions(
          tradeFrequency,
          startDate,
          endDate
        )
      ).to.be.reverted;
    });
  });

  describe("Schedule Helper Calculate Gas Deposit", function () {

    it("Should calculate gas deposit for schedule", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = ethers.utils.parseEther("1");

      //no balance
      let neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateGasDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
        );
      expect(neededDeposit).to.eq(ethers.utils.parseEther("7"));

      //deposit 1 ETH_ADDRESS
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({
          value: ethers.utils.parseEther("1"),
        });
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateGasDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
        );
      expect(neededDeposit).to.eq(ethers.utils.parseEther("6"));

      //deposit 6 ETH_ADDRESS
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({
          value: ethers.utils.parseEther("6"),
        });
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateGasDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
        );
      expect(neededDeposit).to.eq(0);

      //deposit 1 more ETH_ADDRESS more than needed
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({
          value: ethers.utils.parseEther("1"),
        });
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateGasDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
        );
      expect(neededDeposit).to.eq(0);
    });

    it("Should calculate gas deposit invalid trade amount", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = 0;

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .calculateGasDeposit(
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
          )
      ).to.be.reverted;
    });


  });

  describe("Schedule Helper Calculate Deposit", function () {

    it("Should calculate deposit for DAI", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr1.address,
        ethers.utils.parseEther("7")
      );
      await dai
        .connect(addr1)
        .approve(
          hardhatUserScheduleFactory.address,
          ethers.utils.parseEther("7")
        );

      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = ethers.utils.parseEther("1");

      //no balance
      let neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          DAI_ADDRESS
        );
      expect(neededDeposit).to.eq(ethers.utils.parseEther("7"));

      //deposit 1 DAI_ADDRESS
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, ethers.utils.parseEther("1"));
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          DAI_ADDRESS
        );
      expect(neededDeposit).to.eq(ethers.utils.parseEther("6"));

      //deposit 6 DAI_ADDRESS
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, ethers.utils.parseEther("6"));
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          DAI_ADDRESS
        );
      expect(neededDeposit).to.eq(0);

      //deposit 1 more DAI_ADDRESS more than needed
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, ethers.utils.parseEther("1"));
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          DAI_ADDRESS
        );
      expect(neededDeposit).to.eq(0);
    });

    it("Should calculate deposit for ETH", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = ethers.utils.parseEther("1");

      //no balance
      let neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          ETH_ADDRESS
        );
      expect(neededDeposit).to.eq(ethers.utils.parseEther("7"));

      //deposit 1 ETH_ADDRESS
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("1"), {
          value: ethers.utils.parseEther("1"),
        });
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          ETH_ADDRESS
        );
      expect(neededDeposit).to.eq(ethers.utils.parseEther("6"));

      //deposit 6 ETH_ADDRESS
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("6"), {
          value: ethers.utils.parseEther("6"),
        });
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          ETH_ADDRESS
        );
      expect(neededDeposit).to.eq(0);

      //deposit 1 more ETH_ADDRESS more than needed
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("1"), {
          value: ethers.utils.parseEther("1"),
        });
      neededDeposit = await hardhatUserScheduleFactory
        .connect(addr1)
        .calculateDeposit(
          tradeAmount,
          tradeFreq,
          startDate,
          endDate,
          ETH_ADDRESS
        );
      expect(neededDeposit).to.eq(0);
    });

    it("Should calculate deposit invalid trade amount", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = 0;

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .calculateDeposit(
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            DAI_ADDRESS
          )
      ).to.be.reverted;
    });
  });

  describe("Schedule Helper Validation", function () {
    it("Should validate schedule ETH_ADDRESS", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = ethers.utils.parseEther("1");

      //missing deposit
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            ETH_ADDRESS,
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });

      //missing gas
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            ETH_ADDRESS,
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            ETH_ADDRESS,
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.not.be.reverted;
    });

    it("Should validate schedule DAI_ADDRESS", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr1.address,
        ethers.utils.parseEther("7")
      );
      await dai
        .connect(addr1)
        .approve(
          hardhatUserScheduleFactory.address,
          ethers.utils.parseEther("7")
        );

      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = ethers.utils.parseEther("1");

      //missing deposit
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            DAI_ADDRESS,
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, ethers.utils.parseEther("7"));

      //missing gas
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            DAI_ADDRESS,
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            DAI_ADDRESS,
            tradeAmount,
            tradeFreq,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.not.be.reverted;
    });

    it("Should validate schedule invalid", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeFreq = 1 * 86400;
      const tradeAmount = ethers.utils.parseEther("1");

      //invalid dates
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            ETH_ADDRESS,
            tradeAmount,
            tradeFreq,
            endDate,
            startDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      //invalid tradeAmount
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(ETH_ADDRESS, -1, tradeFreq, startDate, endDate, BigNumber.from(1))
      ).to.be.reverted;

      //invalid tradeFreq
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .validateDcaSchedule(
            ETH_ADDRESS,
            tradeAmount,
            100000000000,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;
    });
  });

  describe("Schedule Creation", function () {
    it("Should create daily DCA schedule for DAI/ETH", async function () {
      let getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(0);

      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeAmount = ethers.utils.parseEther("1");
      const tradeFreq = 1 * 86400; //trade daily

      //missing deposit
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });

      //missing gas
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(0, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);

      getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].dcaOwner).to.eq(addr1.address);
      expect(getSchedules[0].tradeFrequency).to.eq(tradeFreq);
      expect(getSchedules[0].tradeAmount).to.eq(tradeAmount);
      expect(getSchedules[0].remainingBudget).to.eq(
        ethers.utils.parseEther("7")
      );
      //   expect(getSchedules[0].totalBudget).to.eq(ethers.utils.parseEther("7"));
      expect(getSchedules[0].buyToken).to.eq(DAI_CHECKSUM);
      expect(getSchedules[0].sellToken).to.eq(ETH_ADDRESS);
      expect(getSchedules[0].isActive).to.eq(true);
      expect(getSchedules[0].scheduleDates[0]).to.eq(startDate);
      expect(getSchedules[0].scheduleDates[1]).to.eq(0);
      expect(getSchedules[0].scheduleDates[2]).to.eq(startDate);
      expect(getSchedules[0].scheduleDates[3]).to.eq(endDate);
    });

    it("Should create daily DCA schedule for ETH/DAI_ADDRESS", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr1.address,
        ethers.utils.parseEther("7")
      );
      await dai
        .connect(addr1)
        .approve(
          hardhatUserScheduleFactory.address,
          ethers.utils.parseEther("7")
        );

      let getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(0);

      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeAmount = ethers.utils.parseEther("1");
      const tradeFreq = 1 * 86400; //trade daily

      //missing deposit
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            ETH_ADDRESS,
            DAI_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, ethers.utils.parseEther("7"));

      //missing gas
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            ETH_ADDRESS,
            DAI_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            ETH_ADDRESS,
            DAI_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(0, ETH_ADDRESS, DAI_CHECKSUM, addr1.address);

      getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].dcaOwner).to.eq(addr1.address);
      expect(getSchedules[0].tradeFrequency).to.eq(tradeFreq);
      expect(getSchedules[0].tradeAmount).to.eq(tradeAmount);
      expect(getSchedules[0].remainingBudget).to.eq(
        ethers.utils.parseEther("7")
      );
      // expect(getSchedules[0].totalBudget).to.eq(ethers.utils.parseEther("7"));
      expect(getSchedules[0].buyToken).to.eq(ETH_ADDRESS);
      expect(getSchedules[0].sellToken).to.eq(DAI_CHECKSUM);
      expect(getSchedules[0].isActive).to.eq(true);
      expect(getSchedules[0].scheduleDates[0]).to.eq(startDate);
      expect(getSchedules[0].scheduleDates[1]).to.eq(0);
      expect(getSchedules[0].scheduleDates[2]).to.eq(startDate);
      expect(getSchedules[0].scheduleDates[3]).to.eq(endDate);
    });

    it("Should create multiasset schedules", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr1.address,
        ethers.utils.parseEther("7")
      );
      await dai
        .connect(addr1)
        .approve(
          hardhatUserScheduleFactory.address,
          ethers.utils.parseEther("7")
        );

      let getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(0);

      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeAmount = ethers.utils.parseEther("1");
      const tradeFreq = 1 * 86400; //trade daily

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(DAI_ADDRESS, ethers.utils.parseEther("7"));
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            ETH_ADDRESS,
            DAI_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(0, ETH_ADDRESS, DAI_CHECKSUM, addr1.address);

      getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].dcaOwner).to.eq(addr1.address);
      expect(getSchedules[0].tradeFrequency).to.eq(tradeFreq);
      expect(getSchedules[0].tradeAmount).to.eq(tradeAmount);
      expect(getSchedules[0].remainingBudget).to.eq(
        ethers.utils.parseEther("7")
      );
      // expect(getSchedules[0].totalBudget).to.eq(ethers.utils.parseEther("7"));
      expect(getSchedules[0].buyToken).to.eq(ETH_ADDRESS);
      expect(getSchedules[0].sellToken).to.eq(DAI_CHECKSUM);
      expect(getSchedules[0].isActive).to.eq(true);
      expect(getSchedules[0].scheduleDates[0]).to.eq(startDate);
      expect(getSchedules[0].scheduleDates[1]).to.eq(0);
      expect(getSchedules[0].scheduleDates[2]).to.eq(startDate);
      expect(getSchedules[0].scheduleDates[3]).to.eq(endDate);

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });
      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(1, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);

      getSchedules = await hardhatUserScheduleFactory
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(2);

      expect(getSchedules[1].dcaOwner).to.eq(addr1.address);
      expect(getSchedules[1].tradeFrequency).to.eq(tradeFreq);
      expect(getSchedules[1].tradeAmount).to.eq(tradeAmount);
      expect(getSchedules[1].remainingBudget).to.eq(
        ethers.utils.parseEther("7")
      );
      //   expect(getSchedules[0].totalBudget).to.eq(ethers.utils.parseEther("7"));
      expect(getSchedules[1].buyToken).to.eq(DAI_CHECKSUM);
      expect(getSchedules[1].sellToken).to.eq(ETH_ADDRESS);
      expect(getSchedules[1].isActive).to.eq(true);
      expect(getSchedules[1].scheduleDates[0]).to.eq(startDate);
      expect(getSchedules[1].scheduleDates[1]).to.eq(0);
      expect(getSchedules[1].scheduleDates[2]).to.eq(startDate);
      expect(getSchedules[1].scheduleDates[3]).to.eq(endDate);
    });

    it("Should create schedule invalid", async function () {
      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeAmount = ethers.utils.parseEther("1");
      const tradeFreq = 1 * 86400; //trade daily

      //missing deposit
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            ETH_ADDRESS,
            DAI_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      ).to.be.reverted;

      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });

      //invalid dates
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            ETH_ADDRESS,
            DAI_ADDRESS,
            endDate,
            startDate
            , BigNumber.from(1)
          )
      ).to.be.reverted;

      //invalid freq
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            -1,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            endDate,
            startDate
            , BigNumber.from(1)
          )
      ).to.be.reverted;

      //invalid amount
      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            -1,
            DAI_ADDRESS,
            ETH_ADDRESS,
            endDate,
            startDate
            , BigNumber.from(1)
          )
      ).to.be.reverted;
    });
  });


  describe("Retrieve Users Schedules Data", function () {
    it("Should get all users and their total schedules", async function () {


      const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
      const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
      const tradeAmount = ethers.utils.parseEther("1");
      const tradeFreq = 1 * 86400; //trade daily


      hardhatUserScheduleFactory
        .connect(addr1)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });


      hardhatUserScheduleFactory
        .connect(addr1)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr1)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(0, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);

      expect(
        await hardhatUserScheduleFactory.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("1")]]);


      hardhatUserScheduleFactory
        .connect(addr2)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });


      hardhatUserScheduleFactory
        .connect(addr2)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr2)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(0, DAI_CHECKSUM, ETH_ADDRESS, addr2.address);


      expect(
        await hardhatUserScheduleFactory.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address, addr2.address], [BigNumber.from("1"), BigNumber.from("1")]]);

      hardhatUserScheduleFactory
        .connect(addr2)
        .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
          value: ethers.utils.parseEther("7"),
        });


      hardhatUserScheduleFactory
        .connect(addr2)
        .depositGas({ value: ethers.utils.parseEther("1") });

      await expect(
        hardhatUserScheduleFactory
          .connect(addr2)
          .createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
      )
        .to.emit(hardhatUserScheduleFactory, "NewUserSchedule")
        .withArgs(1, DAI_CHECKSUM, ETH_ADDRESS, addr2.address);

      expect(
        await hardhatUserScheduleFactory.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address, addr2.address], [BigNumber.from("1"), BigNumber.from("2")]]);

    });


  });

});
