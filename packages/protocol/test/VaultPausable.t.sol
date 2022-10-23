// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {Chief} from "../src/Chief.sol";
import {CoreRoles} from "../src/access/CoreRoles.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVaultFactory} from "../src/vaults/borrowing/BorrowingVaultFactory.sol";
import {BaseVault} from "../src/abstracts/BaseVault.sol";
import {IPausableVault} from "../src/interfaces/IPausableVault.sol";
import {PausableVault} from "../src/abstracts/PausableVault.sol";

contract VaultPausableUnitTests is DSTestPlus, CoreRoles {
  event Paused(address account, IPausableVault.VaultActions actions);
  event Unpaused(address account, IPausableVault.VaultActions actions);
  event PausedForceAll(address account);
  event UnpausedForceAll(address account);

  BorrowingVaultFactory public bVaultFactory;
  BorrowingVault public bvault1;
  BorrowingVault public bvault2;
  Chief public chief;
  TimelockController public timelock;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);
  uint256 bobPkey = 0xB;
  address bob = vm.addr(bobPkey);

  // Pauser and unpauser role
  uint256 charliePkey = 0xC;
  address charlie = vm.addr(charliePkey);

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 1000e18;

  // WETH and DAI prices: 2000 DAI/WETH
  uint256 public constant TEST_USD_PER_ETH_PRICE = 2000e18;
  uint256 public constant TEST_ETH_PER_USD_PRICE = 5e14;

  function setUp() public {
    vm.label(alice, "Alice");
    vm.label(bob, "Bob");
    vm.label(charlie, "charlie");

    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    _utils_setupOracle(address(asset), address(debtAsset));

    mockProvider = new MockProvider();

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    bVaultFactory = new BorrowingVaultFactory(address(chief));

    chief.addToAllowed(address(bVaultFactory));

    bvault1 = BorrowingVault(
      chief.deployVault(
        address(bVaultFactory),
        abi.encode(address(asset), address(debtAsset), address(oracle)),
        "A+"
      )
    );

    _utils_setupVaultProvider(bvault1);

    bvault2 = BorrowingVault(
      chief.deployVault(
        address(bVaultFactory),
        abi.encode(address(asset), address(debtAsset), address(oracle)),
        "B+"
      )
    );

    _utils_setupVaultProvider(bvault2);
  }

  function _utils_setPrice(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_setupOracle(address asset1, address asset2) internal {
    _utils_setPrice(asset1, asset2, TEST_ETH_PER_USD_PRICE);
    _utils_setPrice(asset2, asset1, TEST_USD_PER_ETH_PRICE);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(PAUSER_ROLE, charlie);
    chief.grantRole(UNPAUSER_ROLE, charlie);
  }

  function _utils_callWithTimelock(BorrowingVault vault_, bytes memory sendData) internal {
    timelock.schedule(address(vault_), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(vault_), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProvider(BorrowingVault vault_) internal {
    _utils_setupTestRoles();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    bytes memory sendData = abi.encodeWithSelector(vault_.setProviders.selector, providers);
    _utils_callWithTimelock(vault_, sendData);
    vault_.setActiveProvider(mockProvider);
  }

  function _utils_doDeposit(uint256 amount, BorrowingVault v, address who) internal {
    deal(address(asset), who, amount);
    vm.startPrank(who);
    SafeERC20.safeApprove(asset, address(v), amount);
    v.deposit(amount, who);
    vm.stopPrank();
  }

  function _utils_doWithdraw(uint256 amount, BorrowingVault v, address who) internal {
    vm.prank(who);
    v.withdraw(amount, who, who);
    vm.stopPrank();
  }

  function _utils_doBorrow(uint256 amount, BorrowingVault v, address who) internal {
    vm.prank(who);
    v.borrow(amount, who, who);
    vm.stopPrank();
  }

  function _utils_doPayback(uint256 amount, BorrowingVault v, address who) internal {
    vm.startPrank(who);
    SafeERC20.safeApprove(debtAsset, address(v), amount);
    v.payback(amount, who);
    vm.stopPrank();
  }

  function test_emitPauseActions() public {
    vm.startPrank(charlie);
    vm.expectEmit(true, true, false, false);
    emit Paused(charlie, IPausableVault.VaultActions.Deposit);
    bvault1.pause(IPausableVault.VaultActions.Deposit);
    vm.expectEmit(true, true, false, false);
    emit Paused(charlie, IPausableVault.VaultActions.Withdraw);
    bvault1.pause(IPausableVault.VaultActions.Withdraw);
    vm.expectEmit(true, true, false, false);
    emit Paused(charlie, IPausableVault.VaultActions.Borrow);
    bvault1.pause(IPausableVault.VaultActions.Borrow);
    vm.expectEmit(true, true, false, false);
    emit Paused(charlie, IPausableVault.VaultActions.Payback);
    bvault1.pause(IPausableVault.VaultActions.Payback);
    vm.expectEmit(true, false, false, false);
    emit PausedForceAll(charlie);
    bvault1.pauseForceAll();
    vm.stopPrank();
  }

  function test_emitUnpauseActions() public {
    vm.startPrank(charlie);
    bvault1.pauseForceAll();

    vm.expectEmit(true, true, false, false);
    emit Unpaused(charlie, IPausableVault.VaultActions.Deposit);
    bvault1.unpause(IPausableVault.VaultActions.Deposit);
    vm.expectEmit(true, true, false, false);
    emit Unpaused(charlie, IPausableVault.VaultActions.Withdraw);
    bvault1.unpause(IPausableVault.VaultActions.Withdraw);
    vm.expectEmit(true, true, false, false);
    emit Unpaused(charlie, IPausableVault.VaultActions.Borrow);
    bvault1.unpause(IPausableVault.VaultActions.Borrow);
    vm.expectEmit(true, true, false, false);
    emit Unpaused(charlie, IPausableVault.VaultActions.Payback);
    bvault1.unpause(IPausableVault.VaultActions.Payback);

    bvault1.pauseForceAll();

    vm.expectEmit(true, false, false, false);
    emit UnpausedForceAll(charlie);
    bvault1.unpauseForceAll();

    vm.stopPrank();
  }

  function testFail_tryDepositWhenPaused() public {
    vm.prank(charlie);
    bvault1.pause(IPausableVault.VaultActions.Deposit);
    vm.stopPrank();
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Deposit), true);
  }

  function testFail_tryWithdrawWhenPaused() public {
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    vm.prank(charlie);
    bvault1.pause(IPausableVault.VaultActions.Withdraw);
    vm.stopPrank();
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);
    _utils_doWithdraw(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Withdraw), true);
  }

  function testFail_tryBorrowWhenPaused() public {
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    vm.prank(charlie);
    bvault1.pause(IPausableVault.VaultActions.Borrow);
    vm.stopPrank();
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);
    _utils_doBorrow(BORROW_AMOUNT, bvault1, alice);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Borrow), true);
  }

  function testFail_tryPaybackWhenPaused() public {
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);
    _utils_doBorrow(BORROW_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOfDebt(alice), BORROW_AMOUNT);
    vm.prank(charlie);
    bvault1.pause(IPausableVault.VaultActions.Payback);
    vm.stopPrank();
    _utils_doPayback(BORROW_AMOUNT, bvault1, alice);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Payback), true);
  }

  function test_pauseFailActionsThenUnpauseDoAllActions() public {
    vm.prank(charlie);
    bvault1.pauseForceAll();

    assertEq(bvault1.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(bvault1.paused(IPausableVault.VaultActions.Payback), true);

    deal(address(asset), alice, DEPOSIT_AMOUNT);

    vm.startPrank(alice);
    SafeERC20.safeApprove(asset, address(bvault1), DEPOSIT_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault1.deposit(DEPOSIT_AMOUNT, alice);
    vm.stopPrank();

    vm.prank(charlie);
    bvault1.unpause(IPausableVault.VaultActions.Deposit);
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);

    vm.prank(charlie);
    bvault1.unpause(IPausableVault.VaultActions.Borrow);
    _utils_doBorrow(BORROW_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOfDebt(alice), BORROW_AMOUNT);

    vm.prank(charlie);
    bvault1.unpause(IPausableVault.VaultActions.Payback);
    _utils_doPayback(BORROW_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOfDebt(alice), 0);

    vm.prank(charlie);
    bvault1.unpause(IPausableVault.VaultActions.Withdraw);
    _utils_doWithdraw(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOf(alice), 0);
  }

  function test_pauseDepositAllVaultsFromChief() public {
    vm.prank(charlie);
    chief.pauseActionInAllVaults(IPausableVault.VaultActions.Deposit);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Deposit), true);

    deal(address(asset), alice, DEPOSIT_AMOUNT);
    deal(address(asset), bob, DEPOSIT_AMOUNT);

    // BorrowingVault1 called by Alice
    vm.startPrank(alice);
    SafeERC20.safeApprove(asset, address(bvault1), DEPOSIT_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault1.deposit(DEPOSIT_AMOUNT, alice);
    vm.stopPrank();

    // BorrowingVault2 called by Bob
    vm.startPrank(bob);
    SafeERC20.safeApprove(asset, address(bvault2), DEPOSIT_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault2.deposit(DEPOSIT_AMOUNT, bob);
    vm.stopPrank();
  }

  function test_pauseWithdrawAllVaultsFromChief() public {
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault2, bob);
    assertEq(bvault2.balanceOf(bob), DEPOSIT_AMOUNT);

    vm.prank(charlie);
    chief.pauseActionInAllVaults(IPausableVault.VaultActions.Withdraw);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Withdraw), true);

    // BorrowingVault1 called by Alice
    vm.startPrank(alice);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault1.withdraw(DEPOSIT_AMOUNT, alice, alice);
    vm.stopPrank();

    // BorrowingVault2 called by Bob
    vm.startPrank(bob);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault2.withdraw(DEPOSIT_AMOUNT, bob, bob);
    vm.stopPrank();
  }

  function test_pauseBorrowAllVaultsFromChief() public {
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault2, bob);
    assertEq(bvault2.balanceOf(bob), DEPOSIT_AMOUNT);

    vm.prank(charlie);
    chief.pauseActionInAllVaults(IPausableVault.VaultActions.Borrow);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Borrow), true);

    // BorrowingVault1 called by Alice
    vm.startPrank(alice);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault1.borrow(BORROW_AMOUNT, alice, alice);
    vm.stopPrank();

    // BorrowingVault2 called by Bob
    vm.startPrank(bob);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault2.borrow(BORROW_AMOUNT, bob, bob);
    vm.stopPrank();
  }

  function test_pausePaybackAllVaultsFromChief() public {
    _utils_doDeposit(DEPOSIT_AMOUNT, bvault1, alice);
    _utils_doBorrow(BORROW_AMOUNT, bvault1, alice);
    assertEq(bvault1.balanceOf(alice), DEPOSIT_AMOUNT);
    assertEq(bvault1.balanceOfDebt(alice), BORROW_AMOUNT);

    _utils_doDeposit(DEPOSIT_AMOUNT, bvault2, bob);
    _utils_doBorrow(BORROW_AMOUNT, bvault2, bob);
    assertEq(bvault2.balanceOf(bob), DEPOSIT_AMOUNT);
    assertEq(bvault2.balanceOfDebt(bob), BORROW_AMOUNT);

    vm.prank(charlie);
    chief.pauseActionInAllVaults(IPausableVault.VaultActions.Payback);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Payback), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Payback), true);

    // BorrowingVault1 called by Alice
    vm.startPrank(alice);
    SafeERC20.safeApprove(debtAsset, address(bvault1), BORROW_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault1.payback(BORROW_AMOUNT, alice);
    vm.stopPrank();

    // BorrowingVault2 called by Bob
    vm.startPrank(bob);
    SafeERC20.safeApprove(debtAsset, address(bvault2), BORROW_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_ActionPaused.selector);
    bvault2.payback(BORROW_AMOUNT, bob);
    vm.stopPrank();
  }

  function test_pauseForceAllActionsAllVaultsFromChief() public {
    vm.prank(charlie);
    chief.pauseForceAllVaults();

    assertEq(bvault1.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Deposit), true);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Withdraw), true);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Borrow), true);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Payback), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Payback), true);
  }

  function test_unpauseForceAllActionsAllVaultsFromChief() public {
    vm.prank(charlie);
    chief.pauseForceAllVaults();

    assertEq(bvault1.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Deposit), true);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Withdraw), true);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Borrow), true);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Payback), true);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Payback), true);

    vm.prank(charlie);
    chief.unpauseForceAllVaults();

    assertEq(bvault1.paused(IPausableVault.VaultActions.Deposit), false);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Deposit), false);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Withdraw), false);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Withdraw), false);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Borrow), false);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Borrow), false);

    assertEq(bvault1.paused(IPausableVault.VaultActions.Payback), false);
    assertEq(bvault2.paused(IPausableVault.VaultActions.Payback), false);
  }
}
