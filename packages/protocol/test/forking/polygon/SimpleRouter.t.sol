// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../../forking/ForkingSetup.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {IUniswapV2Router01} from "../../../src/interfaces/uniswap/IUniswapV2Router01.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {SimpleRouter} from "../../../src/routers/SimpleRouter.sol";
import {BaseRouter} from "../../../src/abstracts/BaseRouter.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {UniswapV2Swapper} from "../../../src/swappers/UniswapV2Swapper.sol";
import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";

// This is a test template meant to be used in a forked environement.
// Copy it to the dedicated chain directory and customize it.

// "ForkingSetup"
// Get some basic properties and contracts deployed and initialized or some utility functions:
// - collateralAsset - WETH
// - debtAsset - USDC
// - vault - a borrowing vault
// - (for a complete list check the contract)
// By inheriting from "ForkingSetup", all those are available in your test.
// It also takes care of the fork creation and selection.

contract SimpleRouterTest is Routines, ForkingSetup {
  ILendingProvider public aaveV2;
  ILendingProvider public aaveV3;

  BorrowingVault public vault2;

  IRouter public router;
  ISwapper public swapper;
  IFlasher public flasher;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  address public debtAsset2;

  function setUp() public {
    deploy(POLYGON_DOMAIN);

    address aaveV3Pool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    vm.label(aaveV3Pool, "AaveV3Pool");
    address quickSwap = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    vm.label(quickSwap, "QuickSwap");

    router = new SimpleRouter(IWETH9(collateralAsset), chief);
    flasher = new FlasherAaveV3(aaveV3Pool);
    swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(quickSwap));

    aaveV2 = new AaveV2Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(aaveV2);

    // new BorrowingVault with DAI as debtAsset

    debtAsset2 = registry[POLYGON_DOMAIN].dai;
    mockOracle.setUSDPriceOf(debtAsset2, 100000000);

    vault2 = new BorrowingVault(
      collateralAsset,
      debtAsset2,
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH-DAI Vault Shares",
      "fv2WETHDAI"
    );

    aaveV3 = new AaveV3Polygon();
    providers[0] = aaveV3;

    _setVaultProviders(vault2, providers);
    vault2.setActiveProvider(aaveV3);
  }

  function test_closePositionWithFlashloan() public {
    uint256 withdrawAmount = 2 ether;
    uint256 flashAmount = 1000e6;

    do_depositAndBorrow(withdrawAmount, flashAmount, vault, ALICE);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(router), address(router), withdrawAmount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](4);
    bytes[] memory innerArgs = new bytes[](4);

    innerActions[0] = IRouter.Action.Payback;
    innerActions[1] = IRouter.Action.PermitWithdraw;
    innerActions[2] = IRouter.Action.Withdraw;
    innerActions[3] = IRouter.Action.Swap;

    innerArgs[0] = abi.encode(address(vault), flashAmount, ALICE, address(router));
    innerArgs[1] =
      abi.encode(address(vault), ALICE, address(router), withdrawAmount, deadline, v, r, s);
    innerArgs[2] = abi.encode(address(vault), withdrawAmount, address(router), ALICE);

    uint256 fee = flasher.computeFlashloanFee(debtAsset, flashAmount);
    innerArgs[3] = abi.encode(
      address(swapper),
      collateralAsset,
      debtAsset,
      withdrawAmount,
      flashAmount + fee,
      address(flasher),
      ALICE,
      0
    );
    // ------------

    bytes memory requestorCalldata =
      abi.encodeWithSelector(BaseRouter.xBundle.selector, innerActions, innerArgs);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;
    args[0] =
      abi.encode(address(flasher), debtAsset, flashAmount, address(router), requestorCalldata);

    vm.prank(ALICE);
    router.xBundle(actions, args);

    assertEq(vault.balanceOf(ALICE), 0);
    assertGt(IERC20(collateralAsset).balanceOf(ALICE), 0);
  }
}
