// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

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
import {IVaultPermissions} from "../src/interfaces/IVaultPermissions.sol";
import {SigUtilsHelper} from "./utils/SigUtilsHelper.sol";

contract SimpleRouterTest is DSTestPlus {
  using stdStorage for StdStorage;

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
  SigUtilsHelper public sigUtils;

  MockFlasher public flasher;
  MockOracle public oracle;
  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);

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

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function utils_getPermitBorrowArgs(
    address owner,
    address operator,
    uint256 borrowAmount,
    uint256 plusNonce
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    deadline = block.timestamp + 1 days;
    SigUtilsHelper.Permit memory permit = SigUtilsHelper.Permit({
      owner: owner,
      spender: operator,
      value: borrowAmount,
      nonce: IVaultPermissions(address(vault)).nonces(owner) + plusNonce,
      deadline: deadline
    });
    bytes32 digest = sigUtils.gethashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(address(vault)).DOMAIN_SEPARATOR(),
      sigUtils.getStructHashBorrow(permit)
    );
    (v, r, s) = vm.sign(alicePkey, digest);
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function utils_getPermitAssetsArgs(
    address owner,
    address operator,
    uint256 amount,
    uint256 plusNonce
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    deadline = block.timestamp + 1 days;
    SigUtilsHelper.Permit memory permit = SigUtilsHelper.Permit({
      owner: owner,
      spender: operator,
      value: amount,
      nonce: IVaultPermissions(address(vault)).nonces(owner) + plusNonce,
      deadline: deadline
    });
    bytes32 digest = sigUtils.gethashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(address(vault)).DOMAIN_SEPARATOR(),
      sigUtils.getStructHashAsset(permit)
    );
    (v, r, s) = vm.sign(alicePkey, digest);
  }

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    sigUtils = new SigUtilsHelper();
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

  function test_depositAndBorrow() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      utils_getPermitBorrowArgs(alice, address(simpleRouter), borrowAmount, 0);

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, alice, alice);
    args[1] =
      abi.encode(address(vault), alice, address(simpleRouter), borrowAmount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), borrowAmount, alice, alice);

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
    assertEq(debtAsset.balanceOf(alice), borrowAmount);
  }

  function test_paybackAndWithdraw() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;

    utils_doDepositAndBorrow(amount, borrowAmount, vault);

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      utils_getPermitAssetsArgs(alice, address(simpleRouter), amount, 0);

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.PermitAssets;
    actions[2] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), borrowAmount, alice, alice);
    args[1] = abi.encode(address(vault), alice, address(simpleRouter), amount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), amount, alice, alice);

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

  function test_closePositionWithFlashloan() public {
    uint256 withdrawAmount = 2 ether;
    uint256 flashAmount = 1000e18;

    utils_doDepositAndBorrow(withdrawAmount, flashAmount, vault);

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      utils_getPermitAssetsArgs(alice, address(simpleRouter), withdrawAmount, 0);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](4);
    bytes[] memory innerArgs = new bytes[](4);

    innerActions[0] = IRouter.Action.Payback;
    innerActions[1] = IRouter.Action.PermitAssets;
    innerActions[2] = IRouter.Action.Withdraw;
    innerActions[3] = IRouter.Action.Swap;

    innerArgs[0] = abi.encode(address(vault), flashAmount, alice, address(flasher));
    innerArgs[1] =
      abi.encode(address(vault), alice, address(simpleRouter), withdrawAmount, deadline, v, r, s);
    innerArgs[2] = abi.encode(address(vault), withdrawAmount, address(simpleRouter), alice);
    innerArgs[3] = abi.encode(
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

  function test_refinancePosition() public {
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
    IRouter.Action[] memory innerActions = new IRouter.Action[](7);
    bytes[] memory innerArgs = new bytes[](7);

    innerActions[0] = IRouter.Action.Payback;
    innerActions[1] = IRouter.Action.PermitAssets;
    innerActions[2] = IRouter.Action.Withdraw;
    innerActions[3] = IRouter.Action.Deposit;
    innerActions[4] = IRouter.Action.PermitBorrow;
    innerActions[5] = IRouter.Action.Borrow;
    innerActions[6] = IRouter.Action.Swap;

    innerArgs[0] = abi.encode(address(vault), borrowAmount, alice, address(flasher));
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      utils_getPermitAssetsArgs(alice, address(simpleRouter), amount, 0);
    innerArgs[1] =
      abi.encode(address(vault), alice, address(simpleRouter), amount, deadline, v, r, s);
    innerArgs[2] = abi.encode(address(vault), amount, address(simpleRouter), alice);
    innerArgs[3] = abi.encode(address(newVault), amount, alice, address(simpleRouter));
    (deadline, v, r, s) = utils_getPermitBorrowArgs(alice, address(simpleRouter), borrowAmount, 1);
    innerArgs[4] =
      abi.encode(address(vault), alice, address(simpleRouter), borrowAmount, deadline, v, r, s);
    innerArgs[5] = abi.encode(address(newVault), borrowAmount, address(simpleRouter), alice);
    innerArgs[6] = abi.encode(
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
}
