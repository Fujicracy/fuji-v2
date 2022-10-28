// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

import "forge-std/console2.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {SimpleRouter} from "../../../src/routers/SimpleRouter.sol";
import {IWETH9} from "../../../src/helpers/PeripheryPayments.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {MockFlasher} from "../../../src/mocks/MockFlasher.sol";
import {MockSwapper} from "../../../src/mocks/MockSwapper.sol";
import {MockProvider} from "../../../src/mocks/MockProvider.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {Chief} from "../../../src/Chief.sol";
import {CoreRoles} from "../../../src/access/CoreRoles.sol";
import {IVaultPermissions} from "../../../src/interfaces/IVaultPermissions.sol";
import {MockingSetup} from "../MockingSetup.sol";

contract SimpleRouterUnitTests is MockingSetup {
  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Withdraw(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Payback(address indexed sender, address indexed owner, uint256 debt, uint256 shares);

  ILendingProvider public mockProvider;
  IRouter public simpleRouter;
  ISwapper public swapper;

  MockFlasher public flasher;

  uint256 amount = 2 ether;
  uint256 borrowAmount = 1000e18;

  function setUp() public {
    oracle = new MockOracle();

    swapper = new MockSwapper(oracle);

    flasher = new MockFlasher();

    mockProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(mockProvider);

    simpleRouter = new SimpleRouter(IWETH9(collateralAsset));
  }

  function _depositAndBorrow(uint256 deposit, uint256 debt, IVault vault_) internal {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    bytes[] memory args = new bytes[](3);

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(ALICE, ALICE_PK, address(simpleRouter), debt, 0, address(vault_));

    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    args[0] = abi.encode(address(vault_), deposit, ALICE, ALICE);
    args[1] = abi.encode(address(vault_), ALICE, address(simpleRouter), debt, deadline, v, r, s);
    args[2] = abi.encode(address(vault_), debt, ALICE, ALICE);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, deposit, deposit);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, debt, debt);

    deal(vault_.asset(), ALICE, deposit);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(vault_.asset()), address(simpleRouter), deposit);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();
  }

  function test_depositAndBorrow() public {
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(ALICE, ALICE_PK, address(simpleRouter), borrowAmount, 0, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] =
      abi.encode(address(vault), ALICE, address(simpleRouter), borrowAmount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    deal(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(simpleRouter), amount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_paybackAndWithdraw() public {
    _depositAndBorrow(amount, borrowAmount, vault);

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(ALICE, ALICE_PK, address(simpleRouter), amount, 0, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.PermitWithdraw;
    actions[2] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);
    args[1] = abi.encode(address(vault), ALICE, address(simpleRouter), amount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), amount, ALICE, ALICE);

    vm.expectEmit(true, true, true, true);
    emit Payback(address(simpleRouter), ALICE, borrowAmount, borrowAmount);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), ALICE, ALICE, amount, amount);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(debtAsset), address(simpleRouter), borrowAmount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), 0);
  }

  function test_closePositionWithFlashloan() public {
    uint256 withdrawAmount = 2 ether;
    uint256 flashAmount = 1000e18;

    _depositAndBorrow(withdrawAmount, flashAmount, vault);

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) = _getPermitWithdrawArgs(
      ALICE, ALICE_PK, address(simpleRouter), withdrawAmount, 0, address(vault)
    );

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](4);
    bytes[] memory innerArgs = new bytes[](4);

    innerActions[0] = IRouter.Action.Payback;
    innerActions[1] = IRouter.Action.PermitWithdraw;
    innerActions[2] = IRouter.Action.Withdraw;
    innerActions[3] = IRouter.Action.Swap;

    innerArgs[0] = abi.encode(address(vault), flashAmount, ALICE, address(flasher));
    innerArgs[1] =
      abi.encode(address(vault), ALICE, address(simpleRouter), withdrawAmount, deadline, v, r, s);
    innerArgs[2] = abi.encode(address(vault), withdrawAmount, address(simpleRouter), ALICE);
    innerArgs[3] = abi.encode(
      address(swapper), collateralAsset, debtAsset, withdrawAmount, flashAmount, address(flasher), 0
    );
    // ------------

    IFlasher.FlashloanParams memory params = IFlasher.FlashloanParams(
      debtAsset, flashAmount, address(simpleRouter), innerActions, innerArgs
    );
    uint8 providerId = 0;
    args[0] = abi.encode(address(flasher), params, providerId);

    vm.prank(ALICE);
    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(ALICE), 0);
  }

  function test_refinancePosition() public {
    MockERC20 debtAsset2 = new MockERC20("Test KAI", "tKAI");
    vm.label(address(debtAsset2), "tKAI");

    // WETH and DAI prices by Aug 12h 2022
    oracle.setPriceOf(collateralAsset, address(debtAsset2), 528881643782407);
    oracle.setPriceOf(address(debtAsset2), collateralAsset, 1889069940262927605990);

    IVault newVault = new BorrowingVault(
      collateralAsset,
      address(debtAsset2),
      address(oracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );
    vm.label(address(newVault), "newVault");

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    _setVaultProviders(newVault, providers);
    newVault.setActiveProvider(mockProvider);

    _depositAndBorrow(amount, borrowAmount, vault);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](7);
    bytes[] memory innerArgs = new bytes[](7);

    innerActions[0] = IRouter.Action.Payback; // at initial vault
    innerActions[1] = IRouter.Action.PermitWithdraw; // at initial vault
    innerActions[2] = IRouter.Action.Withdraw; // at initial vault
    innerActions[3] = IRouter.Action.Deposit; // at newVault
    innerActions[4] = IRouter.Action.PermitBorrow; // at newVault
    innerActions[5] = IRouter.Action.Borrow; // at newVault
    innerActions[6] = IRouter.Action.Swap;

    innerArgs[0] = abi.encode(address(vault), borrowAmount, ALICE, address(flasher));
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(ALICE, ALICE_PK, address(simpleRouter), amount, 0, address(vault));
    innerArgs[1] =
      abi.encode(address(vault), ALICE, address(simpleRouter), amount, deadline, v, r, s);
    innerArgs[2] = abi.encode(address(vault), amount, address(simpleRouter), ALICE);
    innerArgs[3] = abi.encode(address(newVault), amount, ALICE, address(simpleRouter));
    (deadline, v, r, s) = _getPermitBorrowArgs(
      ALICE, ALICE_PK, address(simpleRouter), borrowAmount, 0, address(newVault)
    );
    innerArgs[4] =
      abi.encode(address(newVault), ALICE, address(simpleRouter), borrowAmount, deadline, v, r, s);
    innerArgs[5] = abi.encode(address(newVault), borrowAmount, address(simpleRouter), ALICE);
    innerArgs[6] = abi.encode(
      address(swapper),
      address(debtAsset2),
      debtAsset,
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

    vm.prank(ALICE);
    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(newVault.balanceOf(ALICE), amount);
  }
}
