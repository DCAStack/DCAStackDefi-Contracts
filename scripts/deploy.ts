// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { getTokenFromFaucet, DAI_ADDRESS } from "../test/FaucetHelpers";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const DCAStack = await ethers.getContractFactory("DCAStack");
  const dcastack = await DCAStack.deploy();

  await dcastack.deployed();

  console.log("dcastack deployed to:", dcastack.address);


  await getTokenFromFaucet(
    DAI_ADDRESS,
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", //send to top 5 accounts
    ethers.utils.parseEther("100")
  );

  console.log("transfer complete!");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
