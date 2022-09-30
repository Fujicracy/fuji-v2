import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';
import { ethers } from 'ethers';

export let borrowingVaultFactory: Address;

const deployBorrowingVaultFactory = async (hre: HardhatRuntimeEnvironment, chief: Address) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const dx = await deploy('BorrowingVaultFactory', {
    from: deployer,
    args: [chief],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1
  });

  borrowingVaultFactory = dx.address;
};

export default deployBorrowingVaultFactory;
deployBorrowingVaultFactory.tags = ['BorrowingVaultFactory'];
deployBorrowingVaultFactory.skip = async (env: HardhatRuntimeEnvironment) => true;