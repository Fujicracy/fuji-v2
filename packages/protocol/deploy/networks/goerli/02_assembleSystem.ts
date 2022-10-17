import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address, DeployFunction, Deployment} from 'hardhat-deploy/types';

import deployConnextRouter from '../../tasks/deployConnextRouter';
import deployFujiOracle, {
  getAssetAddresses,
  getPriceFeedAddresses,
} from '../../tasks/deployFujiOracle';
import deploySimpleRouter from '../../tasks/deploySimpleRouter';
import { ASSETS } from '../../utils/assets';
import { CONNEXT } from '../../utils/connext';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const assets: Address[] = getAssetAddresses('goerli');
  const priceFeeds: Address[] = getPriceFeedAddresses('goerli');

  const chief: Deployment = await hre.deployments.get('Chief');
  await deployFujiOracle(hre, assets, priceFeeds, chief.address);
  await deploySimpleRouter(hre, ASSETS['goerli'].WETH.address);
  await deployConnextRouter(
    hre,
    ASSETS['goerli'].WETH.address,
    CONNEXT['goerli'].handler
  );
};

export default func;
func.tags = ['Assemble'];
