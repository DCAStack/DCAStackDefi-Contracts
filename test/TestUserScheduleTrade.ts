import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ETH_ADDRESS,
  DAI_ADDRESS,
  WETH_ADDRESS,
  getTokenFromFaucet,
  DAI_CHECKSUM,
  WETH_CHECKSUM,
} from "./FaucetHelpers";
import { BigNumber, Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, deployments, getNamedAccounts, upgrades } from "hardhat";
import { get0xQuote } from "./QuoteHelpers";
import { DCAStack__factory } from "../typechain/euro";

// create new schedules
const startDate = Math.floor(new Date().getTime() / 1000); // get current
const currentDateTime = Math.floor(new Date().getTime() / 1000);
const tradeAmount = ethers.utils.parseEther("1");
const tradeFreq = 1 * 86400; // trade daily
const endDate = Math.floor(new Date().getTime() / 1000) + 86400; // add 1 day

describe("UserScheduleTrade Test Suite", function () {
  let DCAStack: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];

  let DAI_IERC20: Contract;
  let WETH_IERC20: Contract;

  beforeEach(async function () {

    DAI_IERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
    WETH_IERC20 = await ethers.getContractAt("IERC20", WETH_ADDRESS);

    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    const BaseFactory = (await ethers.getContractFactory(
      "DCAStack",
      owner
    )) as DCAStack__factory;
    DCAStack = (await upgrades.deployProxy(BaseFactory, [], {
      initializer: "initialize",
    })) as Contract;
    await DCAStack.deployed();

    //grant roles
    const RUNNER_ROLE = await DCAStack.RUNNER_ROLE();
    const grant = await DCAStack.connect(owner).grantRole(RUNNER_ROLE, addr3.address);
    await expect(grant).to.emit(DCAStack, "RoleGranted").withArgs(RUNNER_ROLE, addr3.address, owner.address)

    // get DAI for addr1
    await getTokenFromFaucet(
      DAI_ADDRESS,
      addr1.address,
      ethers.utils.parseEther("100")
    );

    // approve DAI for addr2
    await DAI_IERC20.connect(addr2).approve(
      DCAStack.address,
      ethers.utils.parseEther("999")
    );

    // setup schedules for user 1
    const depositAmount = ethers.utils.parseEther("1");

    await DCAStack.connect(addr1).depositGas({ value: depositAmount });

    // DAI to buy WETH schedule 0
    await DAI_IERC20.connect(addr1).approve(
      DCAStack.address,
      ethers.utils.parseEther("999")
    );

    await DCAStack.connect(addr1).depositFunds(DAI_ADDRESS, tradeAmount);

    await DCAStack.connect(addr1).createDcaSchedule(
      tradeFreq,
      tradeAmount,
      WETH_ADDRESS,
      DAI_ADDRESS,
      startDate,
      endDate,
      BigNumber.from(1)
    );

    // DAI to buy ETH schedule 1
    await DCAStack.connect(addr1).depositFunds(DAI_ADDRESS, tradeAmount);

    await DCAStack.connect(addr1).createDcaSchedule(
      tradeFreq,
      tradeAmount,
      ETH_ADDRESS,
      DAI_ADDRESS,
      startDate,
      endDate,
      BigNumber.from(1)
    );
  });

  // TODO
  describe("Update User DCA Details", function () {
    it("Should update after swap sold less than amount", async function () { });

    it("Should update after swap used more gas than available", async function () { });
  });


  describe("Swap token to Token", function () {
    it("Should swap DAI to WETH single run", async function () {

      const initialWethBalance = await DCAStack.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const initialDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractWethBalance = await WETH_IERC20.balanceOf(
        DCAStack.address
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const initialGasBalance = await DCAStack.userGasBalances(addr1.address);

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, WETH_ADDRESS, tradeAmount.toString())

      const tx = await DCAStack.connect(addr3).runUserDCA(
        addr1.address,
        0,
        1,
        currentDateTime,
        quote.allowanceTarget,
        quote.to,
        quote.data,
      );

      const addr1GasAfter = await addr1.getBalance();

      expect(addr1GasBefore).to.be.gte(addr1GasAfter);

      const finalWethBalance = await DCAStack.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const finalDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalWethContractBalance = await WETH_IERC20.balanceOf(
        DCAStack.address
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const finalGasBalance = await DCAStack.userGasBalances(addr1.address);

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalWethBalance).gt(initialWethBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(finalWethContractBalance).gt(initialContractWethBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const wethBalDiff = finalWethBalance.sub(initialWethBalance);
      const gasBalDiff = initialGasBalance.sub(finalGasBalance);

      await expect(tx)
        .to.emit(DCAStack, "BoughtTokens")
        .withArgs(
          0,
          DAI_CHECKSUM,
          WETH_CHECKSUM,
          daiBalDiff,
          wethBalDiff,
          0,
          false,
          gasBalDiff,
          finalGasBalance,
          startDate,
          addr1.address
        );

      const userSchedules = await DCAStack.connect(addr1).getUserSchedules(addr1.address);
      const DaiToWeth = userSchedules[0];
      expect(DaiToWeth.remainingBudget).to.equal(0);
      expect(DaiToWeth.isActive).to.equal(false);
      expect(DaiToWeth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[2]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToWeth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToWeth.boughtAmount).to.equal(wethBalDiff);
      expect(DaiToWeth.totalGas).to.be.eq(gasBalDiff);

    });

    it("Should swap DAI to WETH multi run pending", async function () {
      const tradeAmount = ethers.utils.parseEther("1");
      const depositAmount = ethers.utils.parseEther("2");
      const endDate = currentDateTime + 86400 * 2; // add 2 days
      const scheduleNum = 2; // since we're adding schedule

      await DCAStack.connect(addr1).depositFunds(DAI_ADDRESS, depositAmount);

      await DCAStack.connect(addr1).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        WETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

      const initialWethBalance = await DCAStack.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const initialDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractWethBalance = await WETH_IERC20.balanceOf(
        DCAStack.address
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const initialGasBalance = await DCAStack.userGasBalances(addr1.address);

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, WETH_ADDRESS, tradeAmount.toString())

      const tx = await DCAStack.connect(addr3).runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        quote.allowanceTarget,
        quote.to,
        quote.data,
      );

      const addr1GasAfter = await addr1.getBalance();

      expect(addr1GasBefore).to.be.gte(addr1GasAfter);

      const finalWethBalance = await DCAStack.userTokenBalances(
        addr1.address,
        WETH_ADDRESS
      );
      const finalDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalWethContractBalance = await WETH_IERC20.balanceOf(
        DCAStack.address
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const finalGasBalance = await DCAStack.userGasBalances(addr1.address);

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalWethBalance).gt(initialWethBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(finalWethContractBalance).gt(initialContractWethBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const wethBalDiff = finalWethBalance.sub(initialWethBalance);
      const gasBalDiff = initialGasBalance.sub(finalGasBalance);

      await expect(tx)
        .to.emit(DCAStack, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          WETH_CHECKSUM,
          daiBalDiff,
          wethBalDiff,
          ethers.utils.parseEther("1"),
          true,
          gasBalDiff,
          finalGasBalance,
          currentDateTime + tradeFreq,
          addr1.address
        );

      const userSchedules = await DCAStack.connect(addr1).getUserSchedules(addr1.address);
      const DaiToWeth = userSchedules[scheduleNum];
      expect(DaiToWeth.remainingBudget).to.equal(
        ethers.utils.parseEther("1")
      );
      expect(DaiToWeth.isActive).to.equal(true);
      expect(DaiToWeth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToWeth.scheduleDates[2]).to.equal(startDate + tradeFreq);
      expect(DaiToWeth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToWeth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToWeth.boughtAmount).to.equal(wethBalDiff);
      expect(DaiToWeth.totalGas).to.be.eq(gasBalDiff);
    });
  });

  describe("Swap token to ETH", function () {
    it("Should swap DAI to ETH single run", async function () {
      const scheduleNum = 1;

      const initialEthBalance = await DCAStack.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const initialGasBalance = await DCAStack.userGasBalances(addr1.address);

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, ETH_ADDRESS, tradeAmount.toString())

      const tx = await DCAStack.connect(addr3).runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        quote.allowanceTarget,
        quote.to,
        quote.data,
      );

      const addr1GasAfter = await addr1.getBalance();

      expect(addr1GasBefore).to.be.gte(addr1GasAfter);

      const finalEthBalance = await DCAStack.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const finalGasBalance = await DCAStack.userGasBalances(addr1.address);

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalEthBalance).gt(initialEthBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const ethBalDiff = finalEthBalance.sub(initialEthBalance);
      const gasBalDiff = initialGasBalance.sub(finalGasBalance);

      await expect(tx)
        .to.emit(DCAStack, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          ETH_ADDRESS,
          daiBalDiff,
          ethBalDiff,
          0,
          false,
          gasBalDiff,
          finalGasBalance,
          startDate,
          addr1.address
        );

      const userSchedules = await DCAStack.connect(addr1).getUserSchedules(addr1.address);
      const DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.remainingBudget).to.equal(0);
      expect(DaiToEth.isActive).to.equal(false);
      expect(DaiToEth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[2]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToEth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToEth.boughtAmount).to.equal(ethBalDiff);
      expect(DaiToEth.totalGas).to.be.eq(gasBalDiff);

    });

    it("Should swap DAI to ETH multi run pending", async function () {
      const tradeAmount = ethers.utils.parseEther("1");
      const depositAmount = ethers.utils.parseEther("2");
      const endDate = currentDateTime + 86400 * 2; // add 2 days
      const scheduleNum = 2; // since we're adding  schedule

      await DCAStack.connect(addr1).depositFunds(DAI_ADDRESS, depositAmount);

      await DCAStack.connect(addr1).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        ETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

      const initialEthBalance = await DCAStack.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const initialDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const initialContractDaiBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const initialGasBalance = await DCAStack.userGasBalances(addr1.address);

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, ETH_ADDRESS, tradeAmount.toString())

      const tx = await DCAStack.connect(addr3).runUserDCA(
        addr1.address,
        scheduleNum,
        1,
        currentDateTime,
        quote.allowanceTarget,
        quote.to,
        quote.data,
      );

      const addr1GasAfter = await addr1.getBalance();

      expect(addr1GasBefore).to.be.gte(addr1GasAfter);

      const finalEthBalance = await DCAStack.userTokenBalances(
        addr1.address,
        ETH_ADDRESS
      );
      const finalDaiBalance = await DCAStack.userTokenBalances(
        addr1.address,
        DAI_ADDRESS
      );
      const finalDaiContractBalance = await DAI_IERC20.balanceOf(
        DCAStack.address
      );
      const finalGasBalance = await DCAStack.userGasBalances(addr1.address);

      expect(initialDaiBalance).gt(finalDaiBalance);
      expect(finalEthBalance).gt(initialEthBalance);
      expect(initialContractDaiBalance).gt(finalDaiContractBalance);
      expect(initialGasBalance).gt(finalGasBalance);

      const daiBalDiff = initialDaiBalance.sub(finalDaiBalance);
      const ethBalDiff = finalEthBalance.sub(initialEthBalance);
      const gasBalDiff = initialGasBalance.sub(finalGasBalance);

      await expect(tx)
        .to.emit(DCAStack, "BoughtTokens")
        .withArgs(
          scheduleNum,
          DAI_CHECKSUM,
          ETH_ADDRESS,
          daiBalDiff,
          ethBalDiff,
          ethers.utils.parseEther("1"),
          true,
          gasBalDiff,
          finalGasBalance,
          currentDateTime + tradeFreq,
          addr1.address
        );

      const userSchedules = await DCAStack.connect(addr1).getUserSchedules(addr1.address);
      const DaiToEth = userSchedules[scheduleNum];
      expect(DaiToEth.remainingBudget).to.equal(ethers.utils.parseEther("1"));
      expect(DaiToEth.isActive).to.equal(true);
      expect(DaiToEth.scheduleDates[0]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[1]).to.equal(startDate);
      expect(DaiToEth.scheduleDates[2]).to.equal(startDate + tradeFreq);
      expect(DaiToEth.scheduleDates[3]).to.equal(endDate);
      expect(DaiToEth.soldAmount).to.equal(daiBalDiff);
      expect(DaiToEth.boughtAmount).to.equal(ethBalDiff);
      expect(DaiToEth.totalGas).to.be.eq(gasBalDiff);
    });
  });

  describe("Swap invalid scenarios", function () {
    it("Should not swap due to low gas balance", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await DCAStack.connect(addr2).depositFunds(DAI_ADDRESS, tradeAmount);

      await DCAStack.connect(addr2).depositGas({ value: 1 });

      await DCAStack.connect(addr2).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        ETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, ETH_ADDRESS, tradeAmount.toString())

      await expect(
        DCAStack.connect(addr3).runUserDCA(
          addr2.address,
          0,
          1,
          currentDateTime,
          quote.allowanceTarget,
          quote.to,
          quote.data,
        )
      ).to.be.reverted;

      const addr1GasAfter = await addr1.getBalance();

      expect(addr1GasBefore).to.be.gte(addr1GasAfter);
    });

    it("Should not swap due to low token balance", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await DCAStack.connect(addr2).depositFunds(DAI_ADDRESS, tradeAmount);

      const ethAmount = ethers.utils.parseEther("1");
      await DCAStack.connect(addr2).depositGas({ value: ethAmount });

      await DCAStack.connect(addr2).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        ETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

      await DCAStack.connect(addr2).withdrawFunds(DAI_ADDRESS, tradeAmount);

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, ETH_ADDRESS, tradeAmount.toString())

      await expect(
        DCAStack.connect(addr3).runUserDCA(
          addr2.address,
          0,
          1,
          currentDateTime,
          quote.allowanceTarget,
          quote.to,
          quote.data,
        )
      ).to.be.reverted;

      const addr1GasAfter = await addr1.getBalance();

      expect(addr1GasBefore).to.be.gte(addr1GasAfter);
    });

    it("Should not swap due to paused schedule", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await DCAStack.connect(addr2).depositFunds(DAI_ADDRESS, tradeAmount);

      const ethAmount = ethers.utils.parseEther("1");
      await DCAStack.connect(addr2).depositGas({ value: ethAmount });

      await DCAStack.connect(addr2).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        ETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

      let addr1GasBefore = await addr1.getBalance();
      const quote = await get0xQuote(DAI_ADDRESS, ETH_ADDRESS, tradeAmount.toString())

      await expect(
        DCAStack.connect(addr3).runUserDCA(
          addr2.address,
          0,
          1,
          endDate,
          quote.allowanceTarget,
          quote.to,
          quote.data,
        )
      ).to.not.be.reverted;

      let addr1GasAfter = await addr1.getBalance();
      expect(addr1GasBefore).to.be.gte(addr1GasAfter);

      addr1GasBefore = await addr1.getBalance();

      // reverts because schedule concluded
      await expect(
        DCAStack.connect(addr3).runUserDCA(
          addr2.address,
          0,
          1,
          endDate,
          quote.allowanceTarget,
          quote.to,
          quote.data,
        )
      ).to.be.reverted;

      addr1GasAfter = await addr1.getBalance();
      expect(addr1GasBefore).to.be.gte(addr1GasAfter);
    });

    it("Should not swap due to not ready time", async function () {
      await getTokenFromFaucet(
        DAI_ADDRESS,
        addr2.address,
        ethers.utils.parseEther("100")
      );

      await DCAStack.connect(addr2).depositFunds(DAI_ADDRESS, tradeAmount);

      const ethAmount = ethers.utils.parseEther("1");
      await DCAStack.connect(addr2).depositGas({ value: ethAmount });

      await DCAStack.connect(addr2).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        ETH_ADDRESS,
        DAI_ADDRESS,
        startDate,
        endDate,
        BigNumber.from(1)
      );

      const addr1GasBefore = await addr1.getBalance();

      const quote = await get0xQuote(DAI_ADDRESS, ETH_ADDRESS, tradeAmount.toString())

      await expect(
        DCAStack.connect(addr3).runUserDCA(
          addr2.address,
          0,
          1,
          startDate - 1,
          quote.allowanceTarget,
          quote.to,
          quote.data,
        )
      ).to.be.reverted;



      const addr1GasAfter = await addr1.getBalance();
      expect(addr1GasBefore).to.be.gte(addr1GasAfter);
    });
  });
});
