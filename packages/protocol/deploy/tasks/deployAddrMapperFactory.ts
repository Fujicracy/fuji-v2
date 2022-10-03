import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployAddrMapperFactory = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('AddrMapperFactory', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1
  });
};

export default deployAddrMapperFactory;
deployAddrMapperFactory.tags = ['AddrMapperFactory'];
deployAddrMapperFactory.skip = async (env: HardhatRuntimeEnvironment) => true;