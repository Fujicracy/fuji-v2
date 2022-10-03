import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Deployment } from 'hardhat-deploy/types';

import deployChief from "../../tasks/deployChief";
import deployBorrowingVaultFactory from "../../tasks/deployBorrowingVaultFactory";
import deployAddrMapperFactory from "../../tasks/deployAddrMapperFactory";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  await deployChief(hre);
  const chiefDeployment: Deployment = (await hre.deployments.get('Chief'));
  await deployBorrowingVaultFactory(hre, chiefDeployment.address);
  const bVaultFactoryDeployment: Deployment = await hre.deployments.get('BorrowingVaultFactory');
  await deployAddrMapperFactory(hre);

  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.execute('Chief', {
    from: deployer,
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    waitConfirmations: 1
  },
    'addToAllowed',
    bVaultFactoryDeployment.address
  );
};

export default func;
func.tags = ['Factories'];