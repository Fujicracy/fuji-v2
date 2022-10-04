import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction, Address } from 'hardhat-deploy/types';
import { ASSETS } from '../../utils/assets';

import deployFujiOracle,
{ getAssetAddresses, getPriceFeedAddresses } from '../../tasks/deployFujiOracle';
import deploySimpleRouter from '../../tasks/deploySimpleRouter';
import { deployBorrowingVault } from '../../tasks/deployBorrowingVaultFactory';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const assets: Address[] = getAssetAddresses('mainnet');
  const priceFeeds: Address[] = getPriceFeedAddresses('mainnet');

  await deployFujiOracle(hre, assets, priceFeeds);
  await deploySimpleRouter(hre, ASSETS['mainnet'].WETH.address);

  const { deployments } = hre;

  // Define vaults
  await deployBorrowingVault(
    hre,
    ASSETS['mainnet'].WETH.address,
    ASSETS['mainnet'].USDC.address,
    (await deployments.get('FujiOracle')).address,
    [
      (await deployments.get('AaveV2')).address,
      (await deployments.get('CompoundV3')).address,
    ]
  )
};

export default func;
func.tags = ['Assemble'];
