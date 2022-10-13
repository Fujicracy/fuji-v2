import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'hardhat-deploy/types';

const deployConnextRouter = async (
  hre: HardhatRuntimeEnvironment,
  wrappedNative: Address,
  connextHandler: Address
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('ConnextRouter', {
    from: deployer,
    args: [wrappedNative, connextHandler],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    skipIfAlreadyDeployed: true,
    waitConfirmations: 1,
  });
};

export default deployConnextRouter;
deployConnextRouter.tags = ['ConnextRouter'];
deployConnextRouter.skip = async (_env: HardhatRuntimeEnvironment) => true;
