import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Deployment } from 'hardhat-deploy/types';

import deployBorrowingVaultFactory from '../../tasks/deployBorrowingVaultFactory';
import deployChief from '../../tasks/deployChief';
import deployYieldVaultFactory from '../../tasks/deployYieldVaultFactory';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  await deployChief(hre, true, true);

  const chief: Deployment = await hre.deployments.get('Chief');
  await deployBorrowingVaultFactory(hre, chief.address);
  await deployYieldVaultFactory(hre, chief.address);
};

export default func;
func.tags = ['Factories'];
