import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import deployProvider from '../../tasks/deployProvider';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const providerList = ['AaveV3Goerli'];
  for (let i = 0; i < providerList.length; i++) {
    await deployProvider(hre, providerList[i]);
  }
};

export default func;
func.tags = ['Providers'];
