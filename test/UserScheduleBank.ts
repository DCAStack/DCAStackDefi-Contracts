import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UserScheduleBank, IERC20 } from "../typechain";
import { BigNumber } from "ethers";
import { getTokenFromFaucet, ETH, DAI, DAI_CHECKSUM } from "./FaucetHelpers";

describe("UserBank Test Suite", function () {
  let UserScheduleBank;
  let hardhatUserScheduleBank: UserScheduleBank;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];
  let dai: IERC20;

  beforeEach(async function () {
    UserScheduleBank = await ethers.getContractFactory("UserScheduleBank");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    hardhatUserScheduleBank = await UserScheduleBank.deploy();
    dai = <IERC20>await ethers.getContractAt("IERC20", DAI);
  });

  describe("Transactions Simple", function () {

    it("Should deposit/withdraw gas into contract by addr1", async function () {

      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("0.5");

      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositGas({ value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserGasBalance()
      ).to.equal(depositAmount);


      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawGas(withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, ETH, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserGasBalance()
      ).to.equal(withdrawAmount);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawGas(withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, ETH, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserGasBalance()
      ).to.equal(0);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawGas(withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, ETH, withdrawAmount).to.be.reverted;

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserGasBalance()
      ).to.equal(0);

    });


    it("Should deposit/withdraw ETH into contract by addr1", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("0.5");

      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(ETH, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(ETH, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, ETH, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [withdrawAmount]]);
      
    });

    it("Should deposit/withdraw all ETH into contract by addr1", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("1");

      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(ETH, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(ETH, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, ETH, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);
      
    });

    it("Should deposit/withdraw DAI into contract by addr1", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("2");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("1");

      await getTokenFromFaucet(DAI, addr1.address, depositAmount);
      await dai.connect(addr1).approve(hardhatUserScheduleBank.address, depositAmount);

      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(DAI, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, DAI_CHECKSUM, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(DAI, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, DAI_CHECKSUM, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(withdrawAmount);
    });

    it("Should deposit/withdraw all DAI into contract by addr1", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("1");

      await getTokenFromFaucet(DAI, addr1.address, depositAmount);
      await dai.connect(addr1).approve(hardhatUserScheduleBank.address, depositAmount);

      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(DAI, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, DAI_CHECKSUM, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(DAI, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, DAI_CHECKSUM, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);

    });

  });

  describe("Transactions Multiasset", function () {

    it("Should deposit/withdraw ETH+DAI into contract by addr1", async function () {

      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("1");

      //DAI deposit
      await getTokenFromFaucet(DAI, addr1.address, depositAmount);
      await dai.connect(addr1).approve(hardhatUserScheduleBank.address, depositAmount);

      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(DAI, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, DAI_CHECKSUM, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);

      //ETH deposit
      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(ETH, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM, ETH], [depositAmount, depositAmount]]);

      //withdraw all DAI
      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(DAI, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, DAI_CHECKSUM, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);

      //withdraw all ETH
      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(ETH, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, ETH, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);

    });

  });


  describe("Transactions Multiuser", function () {
    it("Should deposit ETH into contract by addr1 but not accessible by addr2", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("0.5");

      //addr1 deposits
      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(ETH, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);

      //addr2 check balances
      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(ETH)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);

    });

    it("Should deposit DAI into contract by addr1 but not accessible by addr2", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("2");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("1");

      //addr1 deposits
      await getTokenFromFaucet(DAI, addr1.address, depositAmount);
      await dai.connect(addr1).approve(hardhatUserScheduleBank.address, depositAmount);
      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(DAI, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, DAI_CHECKSUM, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);

      await expect(
        hardhatUserScheduleBank.connect(addr1).withdrawFunds(DAI, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr1.address, DAI_CHECKSUM, withdrawAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(withdrawAmount);

      //addr2 check balances
      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(DAI)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);

    });

  });

  describe("Transactions Invalid", function () {
    it("Should not let addr2 withdraw more ETH than balance by itself", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("2");

      //addr2 deposits
      await expect(
        hardhatUserScheduleBank
          .connect(addr2)
          .depositFunds(ETH, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr2.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);

      //addr2 withdraws more than it has
      await expect(
        hardhatUserScheduleBank.connect(addr2).withdrawFunds(ETH, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr2.address, ETH, withdrawAmount).to.be.reverted;

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);
    });

    it("Should not let addr2 withdraw more DAI than balance by itself", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("2");

      //addr2 deposits
      await getTokenFromFaucet(DAI, addr2.address, depositAmount);
      await dai.connect(addr2).approve(hardhatUserScheduleBank.address, depositAmount);
      await expect(
        hardhatUserScheduleBank
          .connect(addr2)
          .depositFunds(DAI, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr2.address, DAI_CHECKSUM, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);

      //addr2 withdraws more than it has
      await expect(
        hardhatUserScheduleBank.connect(addr2).withdrawFunds(DAI, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr2.address, ETH, withdrawAmount).to.be.reverted;

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);
    });

    it("Should not let addr2 withdraw more ETH than balance with addr1 funds", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("0.1");

      //addr1 deposits
      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(ETH, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, ETH, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(ETH)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[ETH], [depositAmount]]);

      //addr2 attempts withdrawal
      await expect(
        hardhatUserScheduleBank.connect(addr2).withdrawFunds(ETH, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr2.address, ETH, withdrawAmount).to.be.reverted;

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(ETH)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);
    });

    it("Should not let addr2 withdraw more DAI than balance with addr1 funds", async function () {
      const depositAmount: BigNumber = ethers.utils.parseEther("1");
      const withdrawAmount: BigNumber = ethers.utils.parseEther("0.1");

      //addr1 deposits
      await getTokenFromFaucet(DAI, addr1.address, depositAmount);
      await dai.connect(addr1).approve(hardhatUserScheduleBank.address, depositAmount);
      await expect(
        hardhatUserScheduleBank
          .connect(addr1)
          .depositFunds(DAI, depositAmount, { value: depositAmount })
      )
        .to.emit(hardhatUserScheduleBank, "FundsDeposited")
        .withArgs(addr1.address, DAI_CHECKSUM, depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserTokenBalance(DAI)
      ).to.equal(depositAmount);

      expect(
        await hardhatUserScheduleBank.connect(addr1).getUserAllTokenBalances()
      ).to.deep.equal([[DAI_CHECKSUM], [depositAmount]]);

      //addr2 attempts withdrawal
      await expect(
        hardhatUserScheduleBank.connect(addr2).withdrawFunds(DAI, withdrawAmount)
      )
        .to.emit(hardhatUserScheduleBank, "FundsWithdrawn")
        .withArgs(addr2.address, DAI_CHECKSUM, withdrawAmount).to.be.reverted;

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserTokenBalance(DAI)
      ).to.equal(0);

      expect(
        await hardhatUserScheduleBank.connect(addr2).getUserAllTokenBalances()
      ).to.deep.equal([[], []]);

    });
  });

});
