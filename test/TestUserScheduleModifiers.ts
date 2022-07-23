import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DCAStack, IERC20 } from "../typechain";
import { ETH_ADDRESS, DAI_ADDRESS, DAI_CHECKSUM } from "./FaucetHelpers";
import { BigNumber } from "ethers";

const startDate = new Date("Fri Jul 08 2022 20:26:13").getTime() / 1000;
const endDate = new Date("Fri Jul 15 2022 20:26:13").getTime() / 1000;
const tradeAmount = ethers.utils.parseEther("1");
const tradeFreq = 1 * 86400; //trade daily

describe("UserScheduleFactory Test Suite", function () {
  let DCAStack;
  let hardhatUserScheduleModifiers: DCAStack;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let dai: IERC20;

  beforeEach(async function () {
    DCAStack = await ethers.getContractFactory(
      "DCAStack"
    );
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    hardhatUserScheduleModifiers = await DCAStack.deploy();

    let getSchedules = await hardhatUserScheduleModifiers
      .connect(addr1)
      .getUserSchedules();
    expect(getSchedules.length).to.equal(0);

    hardhatUserScheduleModifiers
      .connect(addr1)
      .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
        value: ethers.utils.parseEther("7"),
      });
    hardhatUserScheduleModifiers
      .connect(addr1)
      .depositGas({ value: ethers.utils.parseEther("1") });

    await expect(
      hardhatUserScheduleModifiers
        .connect(addr1)
        .createDcaSchedule(
          tradeFreq,
          tradeAmount,
          DAI_ADDRESS,
          ETH_ADDRESS,
          startDate,
          endDate
        )
    )
      .to.emit(hardhatUserScheduleModifiers, "NewUserSchedule")
      .withArgs(0, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);

    getSchedules = await hardhatUserScheduleModifiers
      .connect(addr1)
      .getUserSchedules();
    expect(getSchedules.length).to.equal(1);
  });

  describe("Schedule Modifier Pause", function () {
    it("Should pause schedule", async function () {
      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await hardhatUserScheduleModifiers.connect(addr1).changeStatus(0, false);

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(false);
    });

    it("Should pause schedule invalid", async function () {
      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      //change non existent schedule id
      await expect(
        hardhatUserScheduleModifiers.connect(addr1).changeStatus(2, false)
      ).to.be.reverted;
    });

    it("Should NOT pause schedule multiuser", async function () {
      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(getSchedules[0].isActive).to.eq(true);

      await expect(
        hardhatUserScheduleModifiers.connect(addr3).changeStatus(0, false)
      ).to.be.reverted;
    });
  });

  describe("Schedule Modifier Delete", function () {
    it("Should delete schedule", async function () {

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("1")]]);

      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      await hardhatUserScheduleModifiers.connect(addr1).deleteSchedule(0);

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(0);


      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[], []]);

    });

    it("Should delete schedule multiple", async function () {
      for (let i = 0; i < 9; i++) {
        hardhatUserScheduleModifiers
          .connect(addr1)
          .depositFunds(ETH_ADDRESS, ethers.utils.parseEther("7"), {
            value: ethers.utils.parseEther("7"),
          });
        hardhatUserScheduleModifiers
          .connect(addr1)
          .depositGas({ value: ethers.utils.parseEther("1") });

        await expect(
          hardhatUserScheduleModifiers
            .connect(addr1)
            .createDcaSchedule(
              tradeFreq,
              tradeAmount,
              DAI_ADDRESS,
              ETH_ADDRESS,
              startDate,
              endDate
            )
        )
          .to.emit(hardhatUserScheduleModifiers, "NewUserSchedule")
          .withArgs(i + 1, DAI_CHECKSUM, ETH_ADDRESS, addr1.address);
      }

      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(10);

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("10")]]);

      //delete first
      await hardhatUserScheduleModifiers.connect(addr1).deleteSchedule(0);

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(9);

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("9")]]);

      for (let i = 0; i < getSchedules.length; i++) {
        expect(getSchedules[i].dcaOwner).to.eq(addr1.address);
      }

      //delete fifth
      await hardhatUserScheduleModifiers.connect(addr1).deleteSchedule(5);

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(8);

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("8")]]);

      for (let i = 0; i < getSchedules.length; i++) {
        expect(getSchedules[i].dcaOwner).to.eq(addr1.address);
      }

      //delete last
      await hardhatUserScheduleModifiers.connect(addr1).deleteSchedule(7);

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(7);

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("7")]]);

      for (let i = 0; i < getSchedules.length; i++) {
        expect(getSchedules[i].dcaOwner).to.eq(addr1.address);
      }
    });

    it("Should delete schedule invalid", async function () {
      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("1")]]);

      await expect(
        hardhatUserScheduleModifiers.connect(addr1).deleteSchedule(1)
      ).to.be.reverted;

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      expect(
        await hardhatUserScheduleModifiers.getAllUsersSchedules()
      ).to.deep.equal([[addr1.address], [BigNumber.from("1")]]);

    });

    it("Should NOT delete schedule multiuser", async function () {
      let getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);

      await expect(
        hardhatUserScheduleModifiers.connect(addr3).deleteSchedule(0)
      ).to.be.reverted;

      getSchedules = await hardhatUserScheduleModifiers
        .connect(addr1)
        .getUserSchedules();
      expect(getSchedules.length).to.equal(1);
    });
  });
});
