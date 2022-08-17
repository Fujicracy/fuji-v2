// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "forge-std/console2.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {SimpleRouter} from "../src/routers/SimpleRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IFlasher} from "../src/interfaces/IFlasher.sol";
import {ISwapper} from "../src/interfaces/ISwapper.sol";
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
  ISwapper public swapper;

  MockFlasher public flasher;
  MockOracle public oracle;
  MockERC20 public asset;
  MockERC20 public debtAsset;

  address alice = address(0xA);

  function utils_setupOracle(address asset1, address asset2) internal {
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

  function utils_doDepositAndBorrow(uint256 depositAmount, uint256 borrowAmount, IVault v) public {
    IRouter.Action[] memory actions = new IRouter.Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(v), depositAmount, alice, alice);

    actions[1] = IRouter.Action.Borrow;
    args[1] = abi.encode(address(v), borrowAmount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), alice, depositAmount, depositAmount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), alice, borrowAmount, borrowAmount);

    deal(v.asset(), alice, depositAmount);

    vm.startPrank(alice);
    SafeERC20.safeApprove(IERC20(v.asset()), address(simpleRouter), depositAmount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();
  }

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    utils_setupOracle(address(asset), address(debtAsset));

    swapper = new MockSwapper(oracle);

    flasher = new MockFlasher();
    mockProvider = new MockProvider();

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(0)
    );
    simpleRouter = new SimpleRouter(IWETH9(address(asset)));

    vault.setActiveProvider(mockProvider);
  }

  function testDepositAndBorrow() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e18;

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, alice, alice);

    actions[1] = IRouter.Action.Borrow;
    args[1] = abi.encode(address(vault), borrowAmount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), alice, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), alice, borrowAmount, borrowAmount);

    deal(address(asset), alice, amount);

    vm.startPrank(alice);
    SafeERC20.safeApprove(asset, address(simpleRouter), amount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(alice), amount);
  }

  function testPaybackAndWithdraw() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e18;

    utils_doDepositAndBorrow(amount, borrowAmount, vault);

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = IRouter.Action.Payback;
    args[0] = abi.encode(address(vault), borrowAmount, alice, alice);

    actions[1] = IRouter.Action.Withdraw;
    args[1] = abi.encode(address(vault), amount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Payback(address(simpleRouter), alice, borrowAmount, borrowAmount);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), alice, alice, amount, amount);

    vm.startPrank(alice);
    SafeERC20.safeApprove(debtAsset, address(simpleRouter), borrowAmount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(alice), 0);
  }

  function testRefinancePosition() public {
    MockERC20 debtAsset2 = new MockERC20("Test KAI", "tKAI");
    vm.label(address(debtAsset2), "tKAI");

    utils_setupOracle(address(asset), address(debtAsset2));

    IVault newVault = new BorrowingVault(
      address(asset),
      address(debtAsset2),
      address(oracle),
      address(0)
    );
    vm.label(address(newVault), "newVault");

    newVault.setActiveProvider(mockProvider);

    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e18;

    utils_doDepositAndBorrow(amount, borrowAmount, vault);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](5);
    bytes[] memory innerArgs = new bytes[](5);

    innerActions[0] = IRouter.Action.Payback;
    innerArgs[0] = abi.encode(address(vault), borrowAmount, alice, address(flasher));

    innerActions[1] = IRouter.Action.Withdraw;
    innerArgs[1] = abi.encode(address(vault), amount, address(simpleRouter), alice);

    innerActions[2] = IRouter.Action.Deposit;
    innerArgs[2] = abi.encode(address(newVault), amount, alice, address(simpleRouter));

    innerActions[3] = IRouter.Action.Borrow;
    innerArgs[3] = abi.encode(address(newVault), borrowAmount, address(simpleRouter), alice);

    innerActions[4] = IRouter.Action.Swap;
    innerArgs[4] = abi.encode(
      address(swapper),
      address(debtAsset2),
      address(debtAsset),
      borrowAmount,
      borrowAmount,
      address(flasher),
      0
    );
    // ------------

    IFlasher.FlashloanParams memory params = IFlasher.FlashloanParams(
      vault.debtAsset(), borrowAmount, address(simpleRouter), innerActions, innerArgs
    );
    uint8 providerId = 0;
    args[0] = abi.encode(address(flasher), params, providerId);

    vm.prank(alice);
    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), 0);
    assertEq(newVault.balanceOf(alice), amount);
  }

  function testClosePositionWithFlashloan() public {
    uint256 withdrawAmount = 2 ether;
    uint256 flashAmount = 1000e18;

    utils_doDepositAndBorrow(withdrawAmount, flashAmount, vault);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](3);
    bytes[] memory innerArgs = new bytes[](3);

    innerActions[0] = IRouter.Action.Payback;
    innerArgs[0] = abi.encode(address(vault), flashAmount, alice, address(flasher));

    innerActions[1] = IRouter.Action.Withdraw;
    innerArgs[1] = abi.encode(address(vault), withdrawAmount, address(simpleRouter), alice);

    innerActions[2] = IRouter.Action.Swap;
    innerArgs[2] = abi.encode(
      address(swapper),
      address(asset),
      address(debtAsset),
      withdrawAmount,
      flashAmount,
      address(flasher),
      0
    );
    // ------------

    IFlasher.FlashloanParams memory params = IFlasher.FlashloanParams(
      address(debtAsset), flashAmount, address(simpleRouter), innerActions, innerArgs
    );
    uint8 providerId = 0;
    args[0] = abi.encode(address(flasher), params, providerId);

    vm.prank(alice);
    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), 0);
  }
}
