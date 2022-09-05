import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy("DCAStack", {
        from: deployer,
        log: true,
        proxy: {
            proxyContract: "OptimizedTransparentProxy",
        },
    });
};
export default func;
func.tags = ["DCAStack"];

