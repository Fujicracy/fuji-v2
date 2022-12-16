import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Deployment } from 'hardhat-deploy/types';

import deployBorrowingVaultFactory from '../../tasks/deployBorrowingVaultFactory';
import deployChief from '../../tasks/deployChief';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployChief(hre, true, true);

  const chief: Deployment = await deployments.get('Chief');
  await deployBorrowingVaultFactory(hre, chief.address);

  const vaultFactory: Deployment = await deployments.get(
    'BorrowingVaultFactory'
  );

  await deployments.execute(
    'Chief',
    {
      from: deployer,
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      waitConfirmations: 1,
    },
    'addToAllowed',
    vaultFactory.address
  );
};

export default func;
func.tags = ['Factories'];
