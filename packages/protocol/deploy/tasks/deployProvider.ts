import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployProvider = async (
  hre: HardhatRuntimeEnvironment,
  providerName: string
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy(providerName, {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1,
  });
};

export default deployProvider;
deployProvider.tags = ['Providers'];
deployProvider.skip = async (_env: HardhatRuntimeEnvironment) => true;
