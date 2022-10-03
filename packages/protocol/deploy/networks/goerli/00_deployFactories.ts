import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Address } from 'hardhat-deploy/types';

import deployChief, { chief } from "../../tasks/deployChief";
import deployBorrowingVaultFactory, { borrowingVaultFactory } from "../../tasks/deployBorrowingVaultFactory";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  await deployChief(hre);
  await deployBorrowingVaultFactory(hre, chief);
};

export default func;
func.tags = ['Factories'];