import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';

const deploySimpleRouter = async (
  hre: HardhatRuntimeEnvironment,
  wrappedNative: Address
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('SimpleRouter', {
    from: deployer,
    args: [wrappedNative],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1,
  });
};

export default deploySimpleRouter;
deploySimpleRouter.tags = ['SimpleRouter'];
deploySimpleRouter.skip = async (_env: HardhatRuntimeEnvironment) => true;
