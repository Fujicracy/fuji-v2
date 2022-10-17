import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';

import { ASSETS } from '../utils/assets';

export let oracle: Address;

const deployFujiOracle = async (
  hre: HardhatRuntimeEnvironment,
  assetAddresses: string[],
  priceFeedAddresses: string[],
  chiefAddress: Address
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const deployResult = await deploy('FujiOracle', {
    from: deployer,
    args: [assetAddresses, priceFeedAddresses, chiefAddress],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1,
  });

  oracle = deployResult.address;
};

export const getAssetAddresses = (network: string): Address[] => {
  return Object.values(ASSETS[network]).map(
    (asset: { address: string }) => asset.address
  );
};

export const getPriceFeedAddresses = (network: string): Address[] => {
  return Object.values(ASSETS[network]).map(
    (asset: { oracle: string }) => asset.oracle
  );
};

export default deployFujiOracle;
deployFujiOracle.tags = ['Oracle'];
deployFujiOracle.skip = async (_env: HardhatRuntimeEnvironment) => true;
