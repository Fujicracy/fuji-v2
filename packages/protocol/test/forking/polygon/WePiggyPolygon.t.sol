// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {WePiggyPolygon} from "../../../src/providers/polygon/WePiggyPolygon.sol";
import {Chief} from "../../../src/Chief.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";

contract WePiggyPolygonForkingTest is Routines, ForkingSetup {
  ILendingProvider public wePiggy;

  uint256 public constant DEPOSIT_AMOUNT = 1000e18;
  uint256 public constant BORROW_AMOUNT = 100e6;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    wePiggy = new WePiggyPolygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = wePiggy;

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));
    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));

    collateralAsset = registry[POLYGON_DOMAIN].wmatic;
    vault = new BorrowingVault(
            collateralAsset,
            debtAsset,
            address(oracle),
            address(chief),
            'Fuji-V2 WMATIC-USDC Vault Shares',
            'fv2WMATICUSDC',
            providers,
            60e16, //WePiggy max ltv is 60%.
            DEFAULT_LIQ_RATIO
        );

    bytes memory executionCall =
      abi.encodeWithSelector(chief.setVaultStatus.selector, address(vault), true);
    _callWithTimelock(address(chief), executionCall);

    uint256 minAmount = BorrowingVault(payable(address(vault))).minAmount();
    initVaultDebtShares = minAmount;
    initVaultShares =
      _getMinCollateralAmount(BorrowingVault(payable(address(vault))), initVaultDebtShares);

    _initalizeVault(address(vault), INITIALIZER, initVaultShares, initVaultDebtShares);
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
