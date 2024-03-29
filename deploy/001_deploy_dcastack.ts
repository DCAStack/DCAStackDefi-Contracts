import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, execute } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy("DCAStack", {
        from: deployer,
        log: true,
        proxy: network.live == false ? false : {
            owner: deployer,
            proxyContract: "OptimizedTransparentProxy",
            execute: {
                init: {
                    methodName: 'initialize',
                    args: [],
                }
            }
        }
    });


};


export default func;
func.tags = ["DCAStack"];

