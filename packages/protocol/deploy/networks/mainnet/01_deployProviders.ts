import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import deployProvider from "../../tasks/deployProvider";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const providerList = [
    "AaveV2",
    "CompoundV3"
  ];
  for (let i = 0; i < providerList.length; i++) {
    await deployProvider(hre, providerList[i]);
  }
};

export default func;
func.tags = ['Providers'];
