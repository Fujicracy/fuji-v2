// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IV2Pool} from "../../../src/interfaces/aaveV2/IV2Pool.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract DenialOfServiceTest is Routines, ForkingSetup {
  using SafeERC20 for IERC20;

  ILendingProvider public aaveV2;

  uint256 public TROUBLEMAKER_PK = 0x1122;
  address public TROUBLEMAKER = vm.addr(TROUBLEMAKER_PK);

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  IV2Pool public aaveV2pool;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    vm.label(TROUBLEMAKER, "TROUBLEMAKER");

    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    deploy(providers);

    aaveV2pool = IV2Pool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
  }

  function test_denialOfServiceWithdraw() public {
    // Alice deposits and borrows
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);

    // Troublemaker pays vaults debt
    deal(debtAsset, TROUBLEMAKER, BORROW_AMOUNT * 10);
    vm.startPrank(TROUBLEMAKER);
    IERC20(debtAsset).safeApprove(address(aaveV2pool), BORROW_AMOUNT);
    aaveV2pool.repay(vault.debtAsset(), BORROW_AMOUNT, 2, address(vault));
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);

    assertApproxEqAbs(vault.balanceOf(ALICE), 0, 1);
  }

  function test_denialOfServiceWithdrawMoreUsers() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
    do_borrow(BORROW_AMOUNT, vault, BOB);

    // Troublemaker pays vaults debt
    deal(debtAsset, TROUBLEMAKER, BORROW_AMOUNT * 10);
    vm.startPrank(TROUBLEMAKER);
    //TODO check this after rounding issue is fixed
    //approve more than needed because of rounding issues
    IERC20(debtAsset).safeApprove(address(aaveV2pool), BORROW_AMOUNT * 2 + 10);
    //pay full amount, sometimes bigger than BORROW_AMOUNT * 2 due to rounding issue
    aaveV2pool.repay(
      vault.debtAsset(), aaveV2.getBorrowBalance(address(vault), vault), 2, address(vault)
    );
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    assertEq(vault.balanceOfDebt(ALICE), 0);
    assertEq(vault.balanceOf(BOB), DEPOSIT_AMOUNT);
    assertEq(vault.balanceOfDebt(BOB), 0);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    assertApproxEqAbs(maxAmount, DEPOSIT_AMOUNT, 2);
    do_withdraw(maxAmount, vault, ALICE);

    maxAmount = vault.maxWithdraw(BOB);
    assertApproxEqAbs(maxAmount, DEPOSIT_AMOUNT, 2);
    do_withdraw(maxAmount, vault, BOB);

    assertApproxEqAbs(vault.balanceOf(ALICE), 0, 2);
    assertApproxEqAbs(vault.balanceOf(BOB), 0, 2);
  }

  function test_denialOfServiceBorrowPaybackWithdrawFullAmount() public {
    uint256 amountCorrected = BORROW_AMOUNT * 2;

    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
    do_borrow(BORROW_AMOUNT, vault, BOB);

    // Troublemaker pays vaults debt
    deal(debtAsset, TROUBLEMAKER, BORROW_AMOUNT * 10);
    vm.startPrank(TROUBLEMAKER);
    //TODO check this after rounding issue is fixed
    //approve more than needed because of rounding issues
    IERC20(debtAsset).safeApprove(address(aaveV2pool), BORROW_AMOUNT * 2 + 10);
    //pay full amount, sometimes bigger than BORROW_AMOUNT * 2
    aaveV2pool.repay(
      vault.debtAsset(), aaveV2.getBorrowBalance(address(vault), vault), 2, address(vault)
    );
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    assertEq(vault.balanceOfDebt(ALICE), 0);
    assertEq(vault.balanceOf(BOB), DEPOSIT_AMOUNT);
    assertEq(vault.balanceOfDebt(BOB), 0);

    BorrowingVault bvault = BorrowingVault(payable(address(vault)));

    bytes memory data = abi.encodeWithSelector(bvault.correctDebt.selector, amountCorrected);
    _callWithTimelock(address(vault), data);
    skip(2 days);

    assertApproxEqAbs(vault.balanceOfDebt(ALICE), amountCorrected / 2, 1);
    assertApproxEqAbs(vault.balanceOfDebt(BOB), amountCorrected / 2, 1);

    //payback debt
    uint256 amountToPayback = amountCorrected / 2;
    //TODO check this after rounding issue is fixed
    if (vault.balanceOfDebt(ALICE) < amountToPayback) {
      amountToPayback = vault.balanceOfDebt(ALICE);
    }
    do_payback(amountToPayback, vault, ALICE);
    if (vault.balanceOfDebt(BOB) < amountToPayback) {
      amountToPayback = vault.balanceOfDebt(BOB);
    }
    do_payback(amountToPayback, vault, BOB);

    assertApproxEqAbs(vault.balanceOfDebt(ALICE), 0, 1);
    assertApproxEqAbs(vault.balanceOfDebt(BOB), 0, 1);

    //withdraw
    do_withdraw(DEPOSIT_AMOUNT, vault, ALICE);
    do_withdraw(DEPOSIT_AMOUNT, vault, BOB);

    //DEPOSIT_AMOUNT has built up some interest after the call with timelock (lets assume 1%)
    assertApproxEqAbs(vault.balanceOf(ALICE), 0, DEPOSIT_AMOUNT / 100);
    assertApproxEqAbs(vault.balanceOf(BOB), 0, DEPOSIT_AMOUNT / 100);

    //check the actual corrected amount is in the vault
    assertEq(aaveV2.getBorrowBalance(address(vault), vault), 0);
    assertEq(IERC20(debtAsset).balanceOf(address(vault)), amountCorrected);
  }
}
