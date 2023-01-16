// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IronBank} from "../../../src/providers/mainnet/IronBank.sol";
import {IAddrMapper} from "../../../src/interfaces/IAddrMapper.sol";
import {ICToken} from "../../../src/interfaces/compoundV2/ICToken.sol";

contract IronBankTest is Routines, ForkingSetup {
  ILendingProvider public ironBank;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    ironBank = new IronBank();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = ironBank;

    deploy(providers);
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
    assertApproxEqAbs(depositBalance, DEPOSIT_AMOUNT, DEPOSIT_AMOUNT / 1000);
    assertApproxEqAbs(borrowBalance, BORROW_AMOUNT, BORROW_AMOUNT / 1000);
  }

  function test_getBalancesAcrobatic(uint256 nBlocks) public {
    vm.assume(nBlocks > 0 && nBlocks < 100000000);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 borrowBalance = vault.totalDebt();

    uint256 borrowBalance1 = ICToken(
      IAddrMapper(0x529eE84BFE4F37132f5f9599d4cc4Ff16Ee6d0D2).getAddressMapping(
        "IronBank", debtAsset
      )
    ).borrowBalanceCurrent(address(vault));
    assertEq(borrowBalance, borrowBalance1);

    //check after few blocks
    uint256 time = 2 * nBlocks;
    vm.warp(block.timestamp + time);
    vm.roll(block.number + nBlocks);

    borrowBalance = vault.totalDebt();

    borrowBalance1 = ICToken(
      IAddrMapper(0x529eE84BFE4F37132f5f9599d4cc4Ff16Ee6d0D2).getAddressMapping(
        "IronBank", debtAsset
      )
    ).borrowBalanceCurrent(address(vault));

    assertEq(borrowBalance, borrowBalance1);
  }

  function test_getInterestRates() public {
    uint256 depositRate = ironBank.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = ironBank.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }
}
