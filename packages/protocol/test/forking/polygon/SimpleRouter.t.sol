// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
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

contract SimpleRouterForkingTests is Routines, ForkingSetup {
  ILendingProvider public aaveV2;
  ILendingProvider public aaveV3;

  BorrowingVault public vault2;

  IRouter public router;
  ISwapper public swapper;
  IFlasher public flasher;

  address public debtAsset2;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    aaveV2 = new AaveV2Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    deploy(providers);

    address aaveV3Pool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    vm.label(aaveV3Pool, "AaveV3Pool");
    address quickSwap = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    vm.label(quickSwap, "QuickSwap");

    router = new SimpleRouter(IWETH9(collateralAsset), chief);
    flasher = new FlasherAaveV3(aaveV3Pool);
    swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(quickSwap));

    bytes memory data = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), data);

    data = abi.encodeWithSelector(chief.allowSwapper.selector, address(swapper), true);
    _callWithTimelock(address(chief), data);

    // new BorrowingVault with USDT
    debtAsset2 = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    vm.label(debtAsset2, "USDT");

    aaveV3 = new AaveV3Polygon();
    providers[0] = aaveV3;

    vault2 = new BorrowingVault(
      collateralAsset,
      debtAsset2,
      address(oracle),
      address(chief),
      "Fuji-V2 WETH-USDT Vault Shares",
      "fv2WETHUSDT",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO
    );
    vm.label(address(vault2), "Vault2");

    bytes memory executionCall =
      abi.encodeWithSelector(chief.setVaultStatus.selector, address(vault2), true);
    _callWithTimelock(address(chief), executionCall);

    initVaultShares =
      _getMinCollateralAmount(BorrowingVault(payable(address(vault2))), initVaultDebtShares);

    _initalizeVault(address(vault2), INITIALIZER, initVaultShares, initVaultDebtShares);
  }

  function test_closePositionWithFlashloan() public {
    uint256 withdrawAmount = 2 ether;
    uint256 flashAmount = 1000e6;

    do_depositAndBorrow(withdrawAmount, flashAmount, vault, ALICE);

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](4);
    bytes[] memory innerArgs = new bytes[](4);

    innerActions[0] = IRouter.Action.Payback;
    innerActions[1] = IRouter.Action.PermitWithdraw;
    innerActions[2] = IRouter.Action.Withdraw;
    innerActions[3] = IRouter.Action.Swap;

    innerArgs[0] = abi.encode(address(vault), flashAmount, ALICE, address(router));
    innerArgs[1] =
      LibSigUtils.getZeroPermitEncodedArgs(address(vault), ALICE, address(router), withdrawAmount);
    innerArgs[2] = abi.encode(address(vault), withdrawAmount, address(router), ALICE);

    uint256 fee = flasher.computeFlashloanFee(debtAsset, flashAmount);
    innerArgs[3] = abi.encode(
      swapper,
      collateralAsset,
      debtAsset,
      withdrawAmount,
      flashAmount + fee,
      address(flasher), //receiver
      ALICE, //sweeper
      0
    );

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(innerActions, innerArgs);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(router), address(router), withdrawAmount, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    innerArgs[1] =
      abi.encode(address(vault), ALICE, address(router), withdrawAmount, deadline, v, r, s);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;
    args[0] =
      abi.encode(address(flasher), debtAsset, flashAmount, address(router), innerActions, innerArgs);

    vm.prank(ALICE);
    router.xBundle(actions, args);

    assertEq(vault.balanceOf(ALICE), 0);
    assertGt(IERC20(collateralAsset).balanceOf(ALICE), 0);
  }

  function test_debtSwap() public {
    // uint256 amount = 2 ether;
    // uint256 borrowAmount = 1000e6;
    do_depositAndBorrow(2 ether, 1000e6, vault, ALICE);

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

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    {
      // At initial vault
      innerArgs[0] = abi.encode(address(vault), 1000e6, ALICE, address(router));
      innerArgs[1] =
        LibSigUtils.getZeroPermitEncodedArgs(address(vault), ALICE, address(router), 2 ether);
      innerArgs[2] = abi.encode(address(vault), 2 ether, address(router), ALICE);

      // At vault2
      uint256 borrowToPayback = swapper.getAmountIn(
        debtAsset2, debtAsset, 1000e6 + flasher.computeFlashloanFee(debtAsset, 1000e6)
      );

      innerArgs[3] = abi.encode(address(vault2), 2 ether, ALICE, address(router));
      innerArgs[4] = LibSigUtils.getZeroPermitEncodedArgs(
        address(vault2), ALICE, address(router), borrowToPayback
      );
      // Borrow as much needed to account for swap fees
      innerArgs[5] = abi.encode(address(vault2), borrowToPayback, address(router), ALICE);

      // swap to repay flashloan
      innerArgs[6] = abi.encode(
        address(swapper),
        debtAsset2,
        debtAsset,
        borrowToPayback,
        1000e6 + flasher.computeFlashloanFee(debtAsset, 1000e6),
        address(flasher),
        ALICE,
        0,
        address(router)
      );

      LibSigUtils.Permit memory permitW;
      LibSigUtils.Permit memory permitB;
      {
        {
          // Define permits in this scope

          // Get the actionArgsHash
          bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(innerActions, innerArgs);

          permitW = LibSigUtils.buildPermitStruct(
            ALICE, address(router), address(router), 2 ether, 0, address(vault), actionArgsHash
          );
          permitB = LibSigUtils.buildPermitStruct(
            ALICE,
            address(router),
            address(router),
            borrowToPayback,
            0,
            address(vault2),
            actionArgsHash
          );
        }

        {
          // Obtain the sig values for permmitWithdraw and replace innerArgs[1] in this scope

          (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
            _getPermitWithdrawArgs(permitW, ALICE_PK, address(vault));
          // Replace innerArgs[1], now with the signature values.
          innerArgs[1] =
            abi.encode(address(vault), ALICE, address(router), 2 ether, deadline, v, r, s);
        }

        {
          // Obtain the sig values for permitBorrow and replace innerArgs[4] in this scope

          (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
            _getPermitBorrowArgs(permitB, ALICE_PK, address(vault2));
          // Replace innerArgs[4], now with the signature values.
          innerArgs[4] =
            abi.encode(address(vault2), ALICE, address(router), borrowToPayback, deadline, v, r, s);
        }
      }

      actions[0] = IRouter.Action.Flashloan;
      args[0] =
        abi.encode(address(flasher), debtAsset, 1000e6, address(router), innerActions, innerArgs);
    }

    vm.prank(ALICE);
    router.xBundle(actions, args);

    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);
    assertGt(vault2.balanceOf(ALICE), 0);
    assertGe(vault2.balanceOfDebt(ALICE), 1000e6);
  }
}
