// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {DForcePolygon} from "../../../src/providers/polygon/DForcePolygon.sol";
import {IGenIToken} from "../../../src/interfaces/dforce/IGenIToken.sol";
import {IAddrMapper} from "../../../src/interfaces/IAddrMapper.sol";

contract DForcePolygonForkingTest is Routines, ForkingSetup {
  ILendingProvider public dForce;

  uint256 public constant DEPOSIT_AMOUNT = 1000e18;
  uint256 public constant BORROW_AMOUNT = 100e6;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    dForce = new DForcePolygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = dForce;

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

    //account for rounding issue
    assertApproxEqAbs(
      depositBalance - initializeVaultSharesAmount, DEPOSIT_AMOUNT, DEPOSIT_AMOUNT / 1000
    );
    assertApproxEqAbs(
      borrowBalance - initializeVaultSharesDebtAmount, BORROW_AMOUNT, BORROW_AMOUNT / 1000
    );
  }

  function test_getBalancesAcrobatic(uint256 nBlocks) public {
    vm.assume(nBlocks > 0 && nBlocks < 100000000);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 borrowBalance = vault.totalDebt();

    uint256 borrowBalance1 = IGenIToken(
      IAddrMapper(0xe7Aa20127f910dC20492B320f1c0CaB12DFD4153).getAddressMapping("DForce", debtAsset)
    ).borrowBalanceCurrent(address(vault));
    assertEq(borrowBalance, borrowBalance1);

    //check after few blocks
    uint256 time = 1 * nBlocks; //on polygon block time ~2seconds
    vm.warp(block.timestamp + time);
    vm.roll(block.number + nBlocks);

    borrowBalance = vault.totalDebt();

    borrowBalance1 = IGenIToken(
      IAddrMapper(0xe7Aa20127f910dC20492B320f1c0CaB12DFD4153).getAddressMapping("DForce", debtAsset)
    ).borrowBalanceCurrent(address(vault));

    assertEq(borrowBalance, borrowBalance1);
  }

  function test_getInterestRates() public {
    uint256 depositRate = dForce.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = dForce.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }
}
