import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployChief = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('Chief', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1,
  });
};

export default deployChief;
deployChief.tags = ['Chief'];
deployChief.skip = async (_env: HardhatRuntimeEnvironment) => true;
