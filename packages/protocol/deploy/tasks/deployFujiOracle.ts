import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';
import { ASSETS } from '../utils/assets';

export let oracle: Address;

const deployFujiOracle = async (
  hre: HardhatRuntimeEnvironment,
  assetAddresses: string[],
  priceFeedAddresses: string[]
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  let deployResult = await deploy('FujiOracle', {
    from: deployer,
    args: [assetAddresses, priceFeedAddresses],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1
  });

  oracle = deployResult.address;
};

export const getAssetAddresses = (network: string): Address[] => {
  const assetsObj: any[] = Object.values(ASSETS[network]);
  const assets: any[] = assetsObj.map((asset: { address: string }) => asset.address);
  return assets;
}

export const getPriceFeedAddresses = (network: string): Address[] => {
  const priceFeedsObj: any[] = Object.values(ASSETS[network]);
  const priceFeeds: any[] = priceFeedsObj.map((asset: { oracle: string }) => asset.oracle);
  return priceFeeds;
}

export default deployFujiOracle;
deployFujiOracle.tags = ['Oracle'];
deployFujiOracle.skip = async (_env: HardhatRuntimeEnvironment) => true;
