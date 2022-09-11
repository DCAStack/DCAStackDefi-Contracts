import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

// Libraries
import assert from "assert";
import { exec } from "child_process";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  console.log("doing something")
  for (const account of accounts) {
    console.log(account.address);
  }
});

task(
  "copy-deploy",
  "Copies deployments to dependents",
  async (taskArgs, hre) => {
    exec(
      "cp -r deployments/* ../Frontend/src/deployments/",
      (err, stdout, stderr) => {
        if (err || stderr || stdout) {
          console.log("Deployment folder copy error: ", err, stderr, stdout);
        }
      }
    );

    exec(
      "cp -r deployments/* ../Defender/src/deployments/",
      (err, stdout, stderr) => {
        if (err || stderr || stdout) {
          console.log("Deployment folder copy error: ", err, stderr, stdout);
        }
      }
    );
  }
);

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");
const { DEPLOYER_PRIVATE_KEY } = process.env;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
          },
        },
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  networks: {
    hardhat: {
      accounts: {
        accountsBalance:
          process.env.SETUP_TESTS === "true"
            ? "1000000000000000000000000"
            : "100000000000000000000", // wei
      },
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
        blockNumber: process.env.SETUP_TESTS === "true" ? 13779923 : undefined,
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== "false",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
