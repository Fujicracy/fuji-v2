// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "forge-std/console2.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IUniswapV2Router01} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {SimpleRouter} from "../src/routers/SimpleRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IFlasher} from "../src/interfaces/IFlasher.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";
import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {MockFlasher} from "./utils/mocks/MockFlasher.sol";
import {MockSwapper} from "./utils/mocks/MockSwapper.sol";
import {MockProvider} from "./utils/mocks/MockProvider.sol";
import {MockERC20} from "./utils/mocks/MockERC20.sol";
import {MockOracle} from "./utils/mocks/MockOracle.sol";

contract SimpleRouterTest is DSTestPlus {
  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  event Borrow(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  event Payback(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  IVault public vault;
  ILendingProvider public mockProvider;
  IRouter public simpleRouter;
  IUniswapV2Router01 public swapper;

  MockFlasher public flasher;
  MockOracle public oracle;
  MockERC20 public asset;
  MockERC20 public debtAsset;

  address alice = address(0xA);

  function utils_setupOracle(address asset1, address asset2) internal {
    oracle = new MockOracle();
    // WETH and DAI prices by Aug 12h 2022
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(528881643782407)
    );
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset2, asset1, 18),
      abi.encode(1889069940262927605990)
    );
  }

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    utils_setupOracle(address(asset), address(debtAsset));

    swapper = IUniswapV2Router01(address(new MockSwapper(oracle)));
    flasher = new MockFlasher();
    mockProvider = new MockProvider();

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(0)
    );
    simpleRouter = new SimpleRouter(IWETH9(address(asset)), flasher, swapper);

    vault.setActiveProvider(mockProvider);
    simpleRouter.registerVault(vault);
  }

  function testDepositAndBorrow() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e18;

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(address(vault), amount, alice);
    args[1] = abi.encode(address(vault), borrowAmount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), alice, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), alice, borrowAmount, borrowAmount);

    deal(address(asset), alice, amount);

    vm.startPrank(alice);
    SafeERC20.safeApprove(asset, address(simpleRouter), type(uint256).max);

    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), amount);
  }

  function testPaybackAndWithdraw() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e18;

    testDepositAndBorrow();

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(address(vault), borrowAmount, alice);
    args[1] = abi.encode(address(vault), amount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Payback(address(simpleRouter), alice, borrowAmount, borrowAmount);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), alice, alice, amount, amount);

    SafeERC20.safeApprove(debtAsset, address(simpleRouter), type(uint256).max);

    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), 0);
  }

  function testClosePosition() public {
    uint256 withdrawAmount = 2 ether;
    uint256 flashAmount = 1000e18;

    testDepositAndBorrow();

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](2);
    bytes[] memory innerArgs = new bytes[](2);

    innerActions[0] = IRouter.Action.Payback;
    innerArgs[0] = abi.encode(address(vault), flashAmount, alice);

    innerActions[1] = IRouter.Action.Withdraw;
    innerArgs[1] = abi.encode(address(vault), withdrawAmount, address(simpleRouter), alice);
    // ------------

    IFlasher.FlashloanParams memory params = IFlasher.FlashloanParams(
      address(debtAsset), flashAmount, address(simpleRouter), innerActions, innerArgs
    );
    uint8 providerId = 0;
    args[0] = abi.encode(params, providerId);

    actions[1] = IRouter.Action.PaybackFlashloan;
    args[1] = abi.encode(address(asset), address(debtAsset), flashAmount, 0);

    SafeERC20.safeApprove(debtAsset, address(simpleRouter), type(uint256).max);

    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), 0);
  }
}
