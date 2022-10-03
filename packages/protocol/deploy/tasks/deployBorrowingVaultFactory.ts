import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';

const deployBorrowingVaultFactory = async (hre: HardhatRuntimeEnvironment, chief: Address) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('BorrowingVaultFactory', {
    from: deployer,
    args: [chief],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1
  });
};

export default deployBorrowingVaultFactory;
deployBorrowingVaultFactory.tags = ['BorrowingVaultFactory'];
deployBorrowingVaultFactory.skip = async (env: HardhatRuntimeEnvironment) => true;