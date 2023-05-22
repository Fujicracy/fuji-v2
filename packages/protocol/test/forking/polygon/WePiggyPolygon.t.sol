// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {WePiggyPolygon} from "../../../src/providers/polygon/WePiggyPolygon.sol";

contract WePiggyPolygonForkingTest is Routines, ForkingSetup {
  ILendingProvider public wePiggy;

  uint256 public constant DEPOSIT_AMOUNT = 1000e18;
  uint256 public constant BORROW_AMOUNT = 100e6;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    wePiggy = new WePiggyPolygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = wePiggy;

    deployVault(
      registry[POLYGON_DOMAIN].wmatic, registry[POLYGON_DOMAIN].usdc, "WMATIC", "USDC", providers
    );
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 aliceDebt = vault.balanceOfDebt(ALICE);
    do_payback(aliceDebt, vault, ALICE);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);
  }

  function test_getBalances() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();

    uint256 expecteDepositBal = DEPOSIT_AMOUNT + initVaultShares;
    uint256 expecteBorrowBal = BORROW_AMOUNT + initVaultDebtShares;

    //account for rounding issue
    assertApproxEqAbs(depositBalance, expecteDepositBal, expecteDepositBal / 1000);
    assertApproxEqAbs(borrowBalance, expecteBorrowBal, expecteBorrowBal / 1000);
  }

  function test_getInterestRates() public {
    uint256 depositRate = wePiggy.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = wePiggy.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }
}
