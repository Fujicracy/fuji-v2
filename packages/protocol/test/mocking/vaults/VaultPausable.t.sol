// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {IPausableVault} from "../../../src/interfaces/IPausableVault.sol";
import {PausableVault} from "../../../src/abstracts/PausableVault.sol";

contract VaultPausableUnitTests is MockingSetup, MockRoutines {
  event Paused(address account, IPausableVault.VaultActions actions);
  event Unpaused(address account, IPausableVault.VaultActions actions);
  event PausedForceAll(address account);
  event UnpausedForceAll(address account);

  IPausableVault[] public vaults;

  BorrowingVault public vault2;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 1000e18;

  // WETH and DAI prices in 1e18: 2000 DAI/WETH
  uint256 public constant TEST_USD_PER_ETH_PRICE = 2000e18;
  uint256 public constant TEST_ETH_PER_USD_PRICE = 5e14;

  function setUp() public {
    _grantRoleChief(PAUSER_ROLE, CHARLIE);
    _grantRoleChief(UNPAUSER_ROLE, CHARLIE);

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    vault2 = new BorrowingVault(
            collateralAsset,
            debtAsset,
            address(oracle),
            address(chief),
            'Fuji-V2 tWETH-tDAI BorrowingVault',
            'fbvtWETHtDAI',
            providers,
            DEFAULT_MAX_LTV,
            DEFAULT_LIQ_RATIO
        );

    // Set up {Chief-_vaults} manually to bypass vault factory set-up.
    IPausableVault[] memory vaults_ = new IPausableVault[](2);
    vaults_[0] = IPausableVault(address(vault));
    vaults_[1] = IPausableVault(address(vault2));

    vaults = vaults_;

    bytes memory executionCall = abi.encodeWithSelector(chief.setVaultStatus.selector, vault2, true);
    _callWithTimelock(address(chief), executionCall);
  }

  function test_emitPauseActions() public {
    vm.startPrank(CHARLIE);
    vm.expectEmit(true, true, false, false);
    emit Paused(CHARLIE, IPausableVault.VaultActions.Deposit);
    vault.pause(IPausableVault.VaultActions.Deposit);
    vm.expectEmit(true, true, false, false);
    emit Paused(CHARLIE, IPausableVault.VaultActions.Withdraw);
    vault.pause(IPausableVault.VaultActions.Withdraw);
    vm.expectEmit(true, true, false, false);
    emit Paused(CHARLIE, IPausableVault.VaultActions.Borrow);
    vault.pause(IPausableVault.VaultActions.Borrow);
    vm.expectEmit(true, true, false, false);
    emit Paused(CHARLIE, IPausableVault.VaultActions.Payback);
    vault.pause(IPausableVault.VaultActions.Payback);
    vm.expectEmit(true, false, false, false);
    emit PausedForceAll(CHARLIE);
    vault.pauseForceAll();
    vm.stopPrank();
  }

  function test_emitUnpauseActions() public {
    vm.startPrank(CHARLIE);
    vault.pauseForceAll();

    vm.expectEmit(true, true, false, false);
    emit Unpaused(CHARLIE, IPausableVault.VaultActions.Deposit);
    vault.unpause(IPausableVault.VaultActions.Deposit);
    vm.expectEmit(true, true, false, false);
    emit Unpaused(CHARLIE, IPausableVault.VaultActions.Withdraw);
    vault.unpause(IPausableVault.VaultActions.Withdraw);
    vm.expectEmit(true, true, false, false);
    emit Unpaused(CHARLIE, IPausableVault.VaultActions.Borrow);
    vault.unpause(IPausableVault.VaultActions.Borrow);
    vm.expectEmit(true, true, false, false);
    emit Unpaused(CHARLIE, IPausableVault.VaultActions.Payback);
    vault.unpause(IPausableVault.VaultActions.Payback);

    vault.pauseForceAll();

    vm.expectEmit(true, false, false, false);
    emit UnpausedForceAll(CHARLIE);
    vault.unpauseForceAll();

    vm.stopPrank();
  }

  function testFail_tryDepositWhenPaused() public {
    vm.prank(CHARLIE);
    vault.pause(IPausableVault.VaultActions.Deposit);
    vm.stopPrank();
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.paused(IPausableVault.VaultActions.Deposit), true);
  }

  function testFail_tryWithdrawWhenPaused() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    vm.prank(CHARLIE);
    vault.pause(IPausableVault.VaultActions.Withdraw);
    vm.stopPrank();
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    do_withdraw(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.paused(IPausableVault.VaultActions.Withdraw), true);
  }

  function testFail_tryBorrowWhenPaused() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    vm.prank(CHARLIE);
    vault.pause(IPausableVault.VaultActions.Borrow);
    vm.stopPrank();
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
    assertEq(vault.paused(IPausableVault.VaultActions.Borrow), true);
  }

  function testFail_tryPaybackWhenPaused() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOfDebt(ALICE), BORROW_AMOUNT);
    vm.prank(CHARLIE);
    vault.pause(IPausableVault.VaultActions.Payback);
    vm.stopPrank();
    do_payback(BORROW_AMOUNT, vault, ALICE);
    assertEq(vault.paused(IPausableVault.VaultActions.Payback), true);
  }

  function test_pauseFailActionsThenUnpauseDoAllActions() public {
    vm.prank(CHARLIE);
    vault.pauseForceAll();

    assertEq(vault.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(vault.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(vault.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(vault.paused(IPausableVault.VaultActions.Payback), true);

    dealMockERC20(collateralAsset, ALICE, DEPOSIT_AMOUNT);

    vm.startPrank(ALICE);
    IERC20(collateralAsset).approve(address(vault), DEPOSIT_AMOUNT);
    vm.expectRevert();
    vault.deposit(DEPOSIT_AMOUNT, ALICE);
    vm.stopPrank();

    vm.prank(CHARLIE);
    vault.unpause(IPausableVault.VaultActions.Deposit);
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);

    vm.prank(CHARLIE);
    vault.unpause(IPausableVault.VaultActions.Borrow);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOfDebt(ALICE), BORROW_AMOUNT);

    vm.prank(CHARLIE);
    vault.unpause(IPausableVault.VaultActions.Payback);
    do_payback(BORROW_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    vm.prank(CHARLIE);
    vault.unpause(IPausableVault.VaultActions.Withdraw);
    do_withdraw(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), 0);
  }

  function test_pauseDepositAllVaultsFromChief() public {
    vm.prank(CHARLIE);
    chief.pauseActionInVaults(vaults, IPausableVault.VaultActions.Deposit);

    assertEq(vault.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Deposit), true);

    dealMockERC20(collateralAsset, ALICE, DEPOSIT_AMOUNT);
    dealMockERC20(collateralAsset, BOB, DEPOSIT_AMOUNT);

    // Borrowingvault called by ALICE
    vm.startPrank(ALICE);
    IERC20(collateralAsset).approve(address(vault), DEPOSIT_AMOUNT);
    vm.expectRevert();
    vault.deposit(DEPOSIT_AMOUNT, ALICE);
    vm.stopPrank();

    // BorrowingVault2 called by BOB
    vm.startPrank(BOB);
    IERC20(collateralAsset).approve(address(vault2), DEPOSIT_AMOUNT);
    vm.expectRevert();
    vault2.deposit(DEPOSIT_AMOUNT, BOB);
    vm.stopPrank();
  }

  function test_pauseWithdrawAllVaultsFromChief() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    do_deposit(DEPOSIT_AMOUNT, vault2, BOB);
    assertEq(vault2.balanceOf(BOB), DEPOSIT_AMOUNT);

    vm.prank(CHARLIE);
    chief.pauseActionInVaults(vaults, IPausableVault.VaultActions.Withdraw);

    assertEq(vault.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Withdraw), true);

    // Borrowingvault called by ALICE
    vm.startPrank(ALICE);
    vm.expectRevert();
    vault.withdraw(DEPOSIT_AMOUNT, ALICE, ALICE);
    vm.stopPrank();

    // BorrowingVault2 called by BOB
    vm.startPrank(BOB);
    vm.expectRevert();
    vault2.withdraw(DEPOSIT_AMOUNT, BOB, BOB);
    vm.stopPrank();
  }

  function test_pauseBorrowAllVaultsFromChief() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    do_deposit(DEPOSIT_AMOUNT, vault2, BOB);
    assertEq(vault2.balanceOf(BOB), DEPOSIT_AMOUNT);

    vm.prank(CHARLIE);
    chief.pauseActionInVaults(vaults, IPausableVault.VaultActions.Borrow);

    assertEq(vault.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Borrow), true);

    // Borrowingvault called by ALICE
    vm.startPrank(ALICE);
    vm.expectRevert();
    vault.borrow(BORROW_AMOUNT, ALICE, ALICE);
    vm.stopPrank();

    // BorrowingVault2 called by BOB
    vm.startPrank(BOB);
    vm.expectRevert();
    vault2.borrow(BORROW_AMOUNT, BOB, BOB);
    vm.stopPrank();
  }

  function test_pausePaybackAllVaultsFromChief() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    assertEq(vault.balanceOfDebt(ALICE), BORROW_AMOUNT);

    do_deposit(DEPOSIT_AMOUNT, vault2, BOB);
    do_borrow(BORROW_AMOUNT, vault2, BOB);
    assertEq(vault2.balanceOf(BOB), DEPOSIT_AMOUNT);
    assertEq(vault2.balanceOfDebt(BOB), BORROW_AMOUNT);

    vm.prank(CHARLIE);
    chief.pauseActionInVaults(vaults, IPausableVault.VaultActions.Payback);

    assertEq(vault.paused(IPausableVault.VaultActions.Payback), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Payback), true);

    // Borrowingvault called by ALICE
    vm.startPrank(ALICE);
    IERC20(debtAsset).approve(address(vault), BORROW_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_actionPaused.selector);
    vault.payback(BORROW_AMOUNT, ALICE);
    vm.stopPrank();

    // BorrowingVault2 called by BOB
    vm.startPrank(BOB);
    IERC20(debtAsset).approve(address(vault2), BORROW_AMOUNT);
    vm.expectRevert(PausableVault.PausableVault__requiredNotPaused_actionPaused.selector);
    vault2.payback(BORROW_AMOUNT, BOB);
    vm.stopPrank();
  }

  function test_pauseForceAllActionsAllVaultsFromChief() public {
    vm.prank(CHARLIE);
    chief.pauseForceVaults(vaults);

    assertEq(vault.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Deposit), true);

    assertEq(vault.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Withdraw), true);

    assertEq(vault.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Borrow), true);

    assertEq(vault.paused(IPausableVault.VaultActions.Payback), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Payback), true);
  }

  function test_unpauseForceAllActionsAllVaultsFromChief() public {
    vm.prank(CHARLIE);
    chief.pauseForceVaults(vaults);

    assertEq(vault.paused(IPausableVault.VaultActions.Deposit), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Deposit), true);

    assertEq(vault.paused(IPausableVault.VaultActions.Withdraw), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Withdraw), true);

    assertEq(vault.paused(IPausableVault.VaultActions.Borrow), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Borrow), true);

    assertEq(vault.paused(IPausableVault.VaultActions.Payback), true);
    assertEq(vault2.paused(IPausableVault.VaultActions.Payback), true);

    vm.prank(CHARLIE);
    chief.unpauseForceVaults(vaults);

    assertEq(vault.paused(IPausableVault.VaultActions.Deposit), false);
    assertEq(vault2.paused(IPausableVault.VaultActions.Deposit), false);

    assertEq(vault.paused(IPausableVault.VaultActions.Withdraw), false);
    assertEq(vault2.paused(IPausableVault.VaultActions.Withdraw), false);

    assertEq(vault.paused(IPausableVault.VaultActions.Borrow), false);
    assertEq(vault2.paused(IPausableVault.VaultActions.Borrow), false);

    assertEq(vault.paused(IPausableVault.VaultActions.Payback), false);
    assertEq(vault2.paused(IPausableVault.VaultActions.Payback), false);
  }
}
