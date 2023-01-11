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

contract SimpleRouterForkingTest is Routines, ForkingSetup {
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
    aaveV2 = new AaveV2Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    deploy(POLYGON_DOMAIN, providers);

    address aaveV3Pool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    vm.label(aaveV3Pool, "AaveV3Pool");
    address quickSwap = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    vm.label(quickSwap, "QuickSwap");

    router = new SimpleRouter(IWETH9(collateralAsset), chief);
    flasher = new FlasherAaveV3(aaveV3Pool);
    swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(quickSwap));

    // _setVaultProviders(vault, providers);
    // vault.setActiveProvider(aaveV2);

    // new BorrowingVault with USDT
    debtAsset2 = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    vm.label(debtAsset2, "USDT");
    mockOracle.setUSDPriceOf(debtAsset2, 100000000);

    aaveV3 = new AaveV3Polygon();
    providers[0] = aaveV3;

    vault2 = new BorrowingVault(
      collateralAsset,
      debtAsset2,
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH-USDT Vault Shares",
      "fv2WETHUSDT",
      providers
    );
    vm.label(address(vault2), "Vault2");
    // _setVaultProviders(vault2, providers);
    // vault2.setActiveProvider(aaveV3);
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

  function test_debtSwap() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;
    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    LibSigUtils.Permit memory permitW = LibSigUtils.buildPermitStruct(
      ALICE, address(router), address(router), amount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permitW, ALICE_PK, address(vault));

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](7);
    bytes[] memory innerArgs = new bytes[](7);

    innerActions[0] = IRouter.Action.Payback; // at initial vault
    innerActions[1] = IRouter.Action.PermitWithdraw; // at initial vault
    innerActions[2] = IRouter.Action.Withdraw; // at initial vault
    innerActions[3] = IRouter.Action.Deposit; // at vault2
    innerActions[4] = IRouter.Action.PermitBorrow; // at vault2
    innerActions[5] = IRouter.Action.Borrow; // at vault2
    innerActions[6] = IRouter.Action.Swap;

    // at initial vault
    innerArgs[0] = abi.encode(address(vault), borrowAmount, ALICE, address(router));
    innerArgs[1] = abi.encode(address(vault), ALICE, address(router), amount, deadline, v, r, s);
    innerArgs[2] = abi.encode(address(vault), amount, address(router), ALICE);

    // at vault2
    uint256 fee = flasher.computeFlashloanFee(debtAsset, borrowAmount);
    // borrow more to account for swap fees
    LibSigUtils.Permit memory permitB = LibSigUtils.buildPermitStruct(
      ALICE, address(router), address(router), borrowAmount + fee * 30, 0, address(vault2)
    );

    (deadline, v, r, s) = _getPermitBorrowArgs(permitB, ALICE_PK, address(vault2));

    innerArgs[3] = abi.encode(address(vault2), amount, ALICE, address(router));
    innerArgs[4] = abi.encode(
      address(vault2), ALICE, address(router), borrowAmount + fee * 30, deadline, v, r, s
    );
    innerArgs[5] = abi.encode(address(vault2), borrowAmount + fee * 30, address(router), ALICE);

    // swap to repay flashloan
    innerArgs[6] = abi.encode(
      address(swapper),
      debtAsset2,
      debtAsset,
      borrowAmount + fee * 30,
      borrowAmount + fee,
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
      abi.encode(address(flasher), debtAsset, borrowAmount, address(router), requestorCalldata);

    vm.prank(ALICE);
    router.xBundle(actions, args);

    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);
    assertGt(vault2.balanceOf(ALICE), 0);
    assertGe(vault2.balanceOfDebt(ALICE), borrowAmount);
  }
}
