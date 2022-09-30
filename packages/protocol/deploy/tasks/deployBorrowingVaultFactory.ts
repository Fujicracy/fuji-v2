import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const deployBorrowingVaultFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('BorrowingVaultFactory', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1
  });
};
export default deployBorrowingVaultFactory;
deployBorrowingVaultFactory.tags = ['BorrowingVaultFactory'];