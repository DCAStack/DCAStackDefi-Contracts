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
import { setupSafeDeployer } from "hardhat-safe-deployer";
import { Wallet } from "@ethersproject/wallet";

// Libraries
import assert from "assert";
import { exec } from "child_process";

dotenv.config();

const { DCASTACK_KEY, SAFE_SERVICE_URL, DEPLOYER_SAFE } = process.env;

setupSafeDeployer(
  new Wallet(DCASTACK_KEY!!),
  DEPLOYER_SAFE!!,
  SAFE_SERVICE_URL
)

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
    deployer: DEPLOYER_SAFE!!,
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
          "100000000000000000000", // wei
      },
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
      },
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.POLYGON_ALCHEMY_ID}`,

    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_ID}`,
      accounts: [DCASTACK_KEY!!],
      chainId: 5
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== "false",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY ? process.env.POLYGONSCAN_API_KEY : "",
      goerli: process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : "",
    }
  },

};

export default config;
