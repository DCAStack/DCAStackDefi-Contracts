import { ethers, network } from "hardhat";
import { expect } from "chai";
import { IERC20, UserScheduleTrade } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ETH_ADDRESS,
  DAI_ADDRESS,
  WETH_ADDRESS,
  getTokenFromFaucet,
} from "./FaucetHelpers";

const DAI_WHALE = "0xe78388b4ce79068e89bf8aa7f218ef6b9ab0e9d0";

// Agg calldata for transfering 100 DAI to WETH
const daiToWethCallData =
  "0x2e95b6c80000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000000002cc11fa6b521e30000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000003b6d0340c3d03e4f041fd4cd388c549ee2a29a9e5075882fcfee7c08";

// Agg calldata for transfering 100 DAI to ETH
const daiToEthCallData =
  "0x2e95b6c80000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000000002bf5e837c7b7fc0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000140000000000000003b6d0340c3d03e4f041fd4cd388c549ee2a29a9e5075882fcfee7c08";

// Agg calldata fro transfering 100 ETH to DAI
const ethtoDaiCallData =
  "0xe449022e0000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000002a48bd487f28b7740a9f00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000088e6a0c2ddd26feeb64f039a2c41296fcb3f56408000000000000000000000005777d92f208679db4b9778590fa3cab3ac9e2168cfee7c08";

describe("UserScheduleTrade Test Suite", function () {
  let UserScheduleTrade;
  let hhUserScheduleTrade: UserScheduleTrade;
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
    UserScheduleTrade = await ethers.getContractFactory("UserScheduleTrade");

    //   this.accountAddress = '0xa2884fB9F79D7060Bcfaa0e7D8a25b7F725de2fa'
    //   const addr1 = await ethers.getSigner(this.accountAddress);
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    //   this.adapterOwner = await setupAdapterOwner()
    hhUserScheduleTrade = await UserScheduleTrade.deploy();
    //   this.adapter_asOwner = (await UserScheduleTrade.deploy()).connect(this.adapterOwner)

    // get DAI for addr1
    await getTokenFromFaucet(
      DAI_ADDRESS,
      addr1.address,
      ethers.utils.parseEther("200")
    );

    //create new schedules
    const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
    const endDate = new Date("Sat Jul 9 2022 20:26:13").getTime() / 1000;
    const tradeAmount = ethers.utils.parseEther("100");
    const tradeFreq = 1 * 86400; //trade daily

    const depositAmount = ethers.utils.parseEther("1");

    await hhUserScheduleTrade
      .connect(addr1)
      .depositGas({ value: depositAmount });

    //ETH to buy DAI schedule 0
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
        endDate
      );

    await hhUserScheduleTrade
      .connect(owner)
      .populateUserSwapCallData(addr1.address, 0, ethtoDaiCallData);

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
        endDate
      );

    await hhUserScheduleTrade
      .connect(owner)
      .populateUserSwapCallData(addr1.address, 1, daiToWethCallData);

    //DAI to buy ETH schedule 2
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
        endDate
      );

    await hhUserScheduleTrade
      .connect(owner)
      .populateUserSwapCallData(addr1.address, 2, daiToEthCallData);
  });

  describe("Swaps", function () {
    it("Should swap ETH to DAI (ETH to token)", async function () {
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

      const tx = await hhUserScheduleTrade.swapDCA(addr1.address, 0, {
        value: ethers.utils.parseEther("100"),
      });

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
    });

    it("Should swap DAI to WETH (token to token)", async function () {
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

      const tx = await hhUserScheduleTrade.swapDCA(addr1.address, 1);

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
    });

    it("Should swap DAI to ETH (token to ETH)", async function () {
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

      const tx = await hhUserScheduleTrade.swapDCA(addr1.address, 2);

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
    });
  });
});
