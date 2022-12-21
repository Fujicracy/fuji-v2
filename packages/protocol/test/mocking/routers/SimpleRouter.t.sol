// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

import "forge-std/console2.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {SimpleRouter} from "../../../src/routers/SimpleRouter.sol";
import {SystemAccessControl} from "../../../src/access/SystemAccessControl.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
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

  MockERC20 public debtAsset2;
  IVault public newVault;

  function setUp() public {
    oracle = new MockOracle();

    swapper = new MockSwapper(oracle);

    flasher = new MockFlasher();

    mockProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(mockProvider);

    simpleRouter = new SimpleRouter(IWETH9(collateralAsset), chief);
  }

  function _depositAndBorrow(uint256 deposit, uint256 debt, IVault vault_) internal {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    bytes[] memory args = new bytes[](3);

    LibSigUtils.Permit memory permit =
      LibSigUtils.buildPermitStruct(ALICE, address(simpleRouter), ALICE, debt, 0, address(vault));

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault_));

    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    args[0] = abi.encode(address(vault_), deposit, ALICE, ALICE);
    args[1] = abi.encode(address(vault_), ALICE, ALICE, debt, deadline, v, r, s);
    args[2] = abi.encode(address(vault_), debt, ALICE, ALICE);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, deposit, deposit);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, debt, debt);

    _dealMockERC20(vault_.asset(), ALICE, deposit);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(vault_.asset()), address(simpleRouter), deposit);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();
  }

  function test_depositAndBorrow() public {
    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, borrowAmount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] = abi.encode(address(vault), ALICE, ALICE, borrowAmount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    _dealMockERC20(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(simpleRouter), amount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_paybackAndWithdraw() public {
    _depositAndBorrow(amount, borrowAmount, vault);

    LibSigUtils.Permit memory permit =
      LibSigUtils.buildPermitStruct(ALICE, address(simpleRouter), ALICE, amount, 0, address(vault));

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.PermitWithdraw;
    actions[2] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);
    args[1] = abi.encode(address(vault), ALICE, ALICE, amount, deadline, v, r, s);
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

  function test_depositETHAndBorrow() public {
    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, borrowAmount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](4);
    actions[0] = IRouter.Action.DepositETH;
    actions[1] = IRouter.Action.Deposit;
    actions[2] = IRouter.Action.PermitBorrow;
    actions[3] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](4);
    args[0] = abi.encode(amount);
    args[1] = abi.encode(address(vault), amount, ALICE, address(simpleRouter));
    args[2] = abi.encode(address(vault), ALICE, ALICE, borrowAmount, deadline, v, r, s);
    args[3] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    vm.deal(ALICE, amount);

    vm.prank(ALICE);
    simpleRouter.xBundle{value: amount}(actions, args);

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_depositETHAndWithdrawETH() public {
    IRouter.Action[] memory actions = new IRouter.Action[](2);
    actions[0] = IRouter.Action.DepositETH;
    actions[1] = IRouter.Action.Deposit;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(amount);
    args[1] = abi.encode(address(vault), amount, BOB, address(simpleRouter));

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), BOB, amount, amount);

    vm.deal(BOB, amount);

    vm.prank(BOB);
    simpleRouter.xBundle{value: amount}(actions, args);

    assertEq(vault.balanceOf(BOB), amount);

    actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.PermitWithdraw;
    actions[1] = IRouter.Action.Withdraw;
    actions[2] = IRouter.Action.WithdrawETH;

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      BOB, address(simpleRouter), address(simpleRouter), amount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, BOB_PK, address(vault));

    args = new bytes[](3);
    args[0] = abi.encode(address(vault), BOB, address(simpleRouter), amount, deadline, v, r, s);
    args[1] = abi.encode(address(vault), amount, address(simpleRouter), BOB);
    args[2] = abi.encode(amount, BOB);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), address(simpleRouter), BOB, amount, amount);

    vm.prank(BOB);
    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(BOB), 0);
    assertEq(BOB.balance, amount);
  }

  function test_sweepETH(uint256 amount_) public {
    vm.deal(address(simpleRouter), amount_);

    simpleRouter.sweepETH(BOB);
    assertEq(BOB.balance, amount_);
  }

  function test_tryFoeSweepETH(address foe, uint256 amount_) public {
    vm.deal(address(simpleRouter), amount_);

    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyHouseKeeper_notHouseKeeper.selector
    );

    vm.prank(foe);
    simpleRouter.sweepETH(foe);
  }

  function test_sweepToken(uint256 amount_) public {
    _dealMockERC20(collateralAsset, address(simpleRouter), amount_);

    simpleRouter.sweepToken(ERC20(collateralAsset), BOB);
    assertEq(ERC20(collateralAsset).balanceOf(BOB), amount_);
  }

  function test_tryFoeSweepToken(address foe) public {
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyHouseKeeper_notHouseKeeper.selector
    );

    vm.prank(foe);
    simpleRouter.sweepToken(ERC20(collateralAsset), foe);
  }

  function test_depositApprovalAttack() public {
    _dealMockERC20(collateralAsset, ALICE, amount);

    // alice has approved for some reason the router
    vm.prank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    // attacker sets themself as `receiver`.
    args[0] = abi.encode(address(vault), amount, BOB, ALICE);

    vm.expectRevert();
    vm.prank(BOB);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no shares from attack attempt.
    assertEq(vault.balanceOf(BOB), 0);
  }

  function test_withdrawalApprovalAttack() public {
    _dealMockERC20(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);

    simpleRouter.xBundle(actions, args);
    assertGt(vault.balanceOf(ALICE), 0);

    // alice approves withdrawal allowance for the router for some reason
    uint256 allowance = vault.previewRedeem(vault.balanceOf(ALICE));
    IVaultPermissions(address(vault)).increaseWithdrawAllowance(
      address(simpleRouter), address(simpleRouter), allowance
    );
    vm.stopPrank();

    // attacker front-runs and calls withdraw
    // using Alice `withdrawAllowance` and attempts to deposits,
    // with themselves as receiver
    IRouter.Action[] memory attackerActions = new IRouter.Action[](2);
    bytes[] memory attackerArgs = new bytes[](2);

    attackerActions[0] = IRouter.Action.Withdraw;
    attackerArgs[0] = abi.encode(address(vault), amount, address(simpleRouter), ALICE);

    attackerActions[1] = IRouter.Action.Deposit;
    attackerArgs[1] = abi.encode(address(vault), amount, BOB, address(simpleRouter));

    vm.expectRevert();
    vm.prank(BOB);
    simpleRouter.xBundle(attackerActions, attackerArgs);

    // Assert attacker received no shares from attack attempt.
    assertEq(vault.balanceOf(BOB), 0);
  }

  function test_depositStuckFundsExploit() public {
    // Funds are stuck at the router.
    _dealMockERC20(collateralAsset, address(simpleRouter), amount);

    // attacker attempts to deposit the stuck funds to themselves.
    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, ALICE, address(simpleRouter));

    vm.expectRevert();
    vm.prank(ALICE);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no funds.
    assertEq(IERC20(debtAsset).balanceOf(ALICE), 0);
  }
}
