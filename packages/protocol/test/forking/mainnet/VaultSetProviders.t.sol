// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../../forking/ForkingSetup.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {SimpleRouter} from "../../../src/routers/SimpleRouter.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";

contract VaultSetProvidersForkingTest is Routines, ForkingSetup {
  ILendingProvider public aaveV2;
  ILendingProvider public aaveV3;
  IRouter public router;
  IFlasher public flasher;

  RebalancerManager rebalancer;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    aaveV2 = new AaveV2Polygon();
    aaveV3 = new AaveV3Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = aaveV3; // activeProvider
    providers[1] = aaveV2;

    // Using USDT as the debt asset.
    // because USDT reverts on approve if they already have an allowance
    debtAsset = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    deploy(providers);
  }

  function test_setRepeatedProviders() public {
    //vault has AaveV2 and AaveV3
    //calling set providers with AaveV3 shouldnt revert
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3;

    bytes memory data = abi.encodeWithSelector(IVault.setProviders.selector, providers);
    _callWithTimelock(address(vault), data);
  }
}
