// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {HundredGnosis} from "../../../src/providers/gnosis/HundredGnosis.sol";
import {IAddrMapper} from "../../../src/interfaces/IAddrMapper.sol";
import {ICToken} from "../../../src/interfaces/compoundV2/ICToken.sol";

/**
 * @custom:disabled hundred finance was exploited on April 15th, 2023.
 * Mint is paused for their hTokens.
 * The tests in this suite are disabled until further notice.
 */
// contract HundredGnosisForkingTests is Routines, ForkingSetup {
contract HundredGnosisDisabledTest is Routines, ForkingSetup {
  ILendingProvider public hundred;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork(GNOSIS_DOMAIN);

    hundred = new HundredGnosis();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = hundred;

    deployVault(registry[GNOSIS_DOMAIN].weth, registry[GNOSIS_DOMAIN].dai, "WETH", "DAI", providers);
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
      IAddrMapper(0x2B3A214b2218f1ce35E94eE3BA14D8aF1712AB04).getAddressMapping(
        "Hundred", debtAsset
      )
    ).borrowBalanceCurrent(address(vault));
    assertEq(borrowBalance, borrowBalance1);

    //check after few blocks
    uint256 time = 2 * nBlocks;
    vm.warp(block.timestamp + time);
    vm.roll(block.number + nBlocks);

    borrowBalance = vault.totalDebt();

    borrowBalance1 = ICToken(
      IAddrMapper(0x2B3A214b2218f1ce35E94eE3BA14D8aF1712AB04).getAddressMapping(
        "Hundred", debtAsset
      )
    ).borrowBalanceCurrent(address(vault));

    assertEq(borrowBalance, borrowBalance1);
  }

  function test_getInterestRates() public {
    uint256 depositRate = hundred.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = hundred.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }
}
