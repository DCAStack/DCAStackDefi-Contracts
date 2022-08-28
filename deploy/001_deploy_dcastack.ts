import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { exec } from 'child_process';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy('DCAStack', {
        from: deployer,
        log: true,
    });


};
export default func;
func.tags = ['DCAStack'];

//make sure to update deployments in our other codebases
exec('cp -r deployments/* ../FrontEnd/src/deployments/', (err, stdout, stderr) => {
    if (err || stderr || stdout) {
        console.log("Deployment folder copy error: ", err, stderr, stdout)
    }
});

exec('cp -r deployments/* ../Defender/src/deployments/', (err, stdout, stderr) => {
    if (err || stderr || stdout) {
        console.log("Deployment folder copy error: ", err, stderr, stdout)
    }
});