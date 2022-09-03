import { expect } from "chai";
import { ethers, deployments, getNamedAccounts } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IERC20 } from "../typechain";
import { ETH_ADDRESS, DAI_ADDRESS, DAI_CHECKSUM } from "./FaucetHelpers";
import { BigNumber, Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";

const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
const tradeAmount = ethers.utils.parseEther("0.1");
const tradeFreq = 1 * 86400; // trade daily

describe("UserScheduleFactory Schedule Modifiers Test Suite", function () {
  let DCAStack: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let dai: IERC20;

  beforeEach(async function () {
    await deployments.fixture(["DCAStack"]);
    const DCAStackSetup = await deployments.get("DCAStack");

    DCAStack = await ethers.getContractAt(
      DCAStackSetup.abi,
      DCAStackSetup.address
    );

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
    expect(getSchedules.length).to.equal(0);

    DCAStack.connect(addr1).depositFunds(
      ETH_ADDRESS,
      ethers.utils.parseEther("0.7"),
      {
        value: ethers.utils.parseEther("0.7"),
      }
    );

    await expect(
      DCAStack.connect(addr1).depositGas({
        value: ethers.utils.parseEther("1"),
      })
    )
      .to.emit(DCAStack, "FundsDeposited")
      .withArgs(addr1.address, ETH_ADDRESS, ethers.utils.parseEther("1"));

    expect(await DCAStack.userGasBalances(addr1.address)).to.equal(
      ethers.utils.parseEther("1")
    );

    await expect(
      DCAStack.connect(addr1).createDcaSchedule(
        tradeFreq,
        tradeAmount,
        DAI_ADDRESS,
        ETH_ADDRESS,
        startDate,
        endDate,
        parseEther("0.0000001")
      )
    )
      .to.emit(DCAStack, "NewUserSchedule")
      .withArgs(0, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);

    getSchedules = await DCAStack.connect(addr1).getUserSchedules();
    expect(getSchedules.length).to.equal(1);
  });

  describe("Schedule Modifier Pause", function () {
    it("Should pause schedule", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await DCAStack.connect(addr1).pauseSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);
    });

    it("Should pause schedule invalid", async function () {
      const getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      // change non existent schedule id
      await expect(DCAStack.connect(addr1).pauseSchedule(2)).to.be.reverted;
    });

    it("Should NOT pause schedule multiuser", async function () {
      const getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await expect(DCAStack.connect(addr3).pauseSchedule(0)).to.be.reverted;
    });
  });

  describe("Schedule Modifier Delete", function () {
    it("Should delete schedule", async function () {
      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("1")],
      ]);

      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      await DCAStack.connect(addr1).deleteSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(0);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([[], []]);
    });

    it("Should delete schedule multiple", async function () {
      for (let i = 0; i < 9; i++) {
        DCAStack.connect(addr1).depositFunds(
          ETH_ADDRESS,
          ethers.utils.parseEther("7"),
          {
            value: ethers.utils.parseEther("7"),
          }
        );
        DCAStack.connect(addr1).depositGas({
          value: ethers.utils.parseEther("1"),
        });

        await expect(
          DCAStack.connect(addr1).createDcaSchedule(
            tradeFreq,
            tradeAmount,
            DAI_ADDRESS,
            ETH_ADDRESS,
            startDate,
            endDate,
            BigNumber.from(1)
          )
        )
          .to.emit(DCAStack, "NewUserSchedule")
          .withArgs(i + 1, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);
      }

      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(10);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("10")],
      ]);

      // delete first
      await DCAStack.connect(addr1).deleteSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(9);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("9")],
      ]);

      // delete fifth
      await DCAStack.connect(addr1).deleteSchedule(5);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(8);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("8")],
      ]);

      // delete last
      await DCAStack.connect(addr1).deleteSchedule(7);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(7);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("7")],
      ]);
    });

    it("Should delete schedule invalid", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("1")],
      ]);

      await expect(DCAStack.connect(addr1).deleteSchedule(1)).to.be.reverted;

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(await DCAStack.getAllUsersSchedules()).to.deep.equal([
        [addr1.address],
        [BigNumber.from("1")],
      ]);
    });

    it("Should NOT delete schedule multiuser", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      await expect(DCAStack.connect(addr3).deleteSchedule(0)).to.be.reverted;

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);
    });
  });

  describe("Schedule Modifier Resume", function () {
    it("Should resume schedule", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await DCAStack.connect(addr1).pauseSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);

      await DCAStack.connect(addr1).resumeSchedule(0, parseEther("0.01"));
      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);
      expect(getSchedules[0].isActive).to.eq(true);
    });

    it("Should NOT resume schedule due to low gas", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await DCAStack.connect(addr1).pauseSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);

      await expect(DCAStack.connect(addr1).resumeSchedule(0, parseEther("100")))
        .to.be.reverted;
      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);
      expect(getSchedules[0].isActive).to.eq(false);
    });

    it("Should NOT resume schedule due to low gas partial withdraw", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await DCAStack.connect(addr1).pauseSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);

      DCAStack.connect(addr1).withdrawGas(parseEther("0.9"));

      await expect(DCAStack.connect(addr1).resumeSchedule(0, parseEther("0.1")))
        .to.be.reverted;
      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);
      expect(getSchedules[0].isActive).to.eq(false);
    });

    it("Should NOT resume schedule due to low bal", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await DCAStack.connect(addr1).pauseSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);

      await DCAStack.connect(addr1).withdrawFunds(
        ETH_ADDRESS,
        parseEther("0.7")
      );
      await expect(
        DCAStack.connect(addr1).resumeSchedule(0, parseEther("0.01"))
      ).to.be.reverted;
      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);
      expect(getSchedules[0].isActive).to.eq(false);
    });

    it("Should NOT resume schedule due to low bal partial withdraw", async function () {
      let getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await DCAStack.connect(addr1).pauseSchedule(0);

      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);

      await DCAStack.connect(addr1).withdrawFunds(
        ETH_ADDRESS,
        parseEther("0.1")
      );
      await expect(
        DCAStack.connect(addr1).resumeSchedule(0, parseEther("0.01"))
      ).to.be.reverted;
      getSchedules = await DCAStack.connect(addr1).getUserSchedules();
      expect(getSchedules.length).to.equal(1);
      expect(getSchedules[0].isActive).to.eq(false);
    });
  });
});
