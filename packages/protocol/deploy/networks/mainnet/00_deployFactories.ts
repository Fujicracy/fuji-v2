import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Address } from 'hardhat-deploy/types';

import deployChief from "../../tasks/deployChief";
import deployBorrowingVaultFactory from "../../tasks/deployBorrowingVaultFactory";
import deployAddrMapperFactory from "../../tasks/deployAddrMapperFactory";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  await deployChief(hre);
  const chief: Address = (await hre.deployments.get('Chief')).address;
  await deployBorrowingVaultFactory(hre, chief);
  await deployAddrMapperFactory(hre);
};

export default func;
func.tags = ['Factories'];