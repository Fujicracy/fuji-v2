// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH9} from "../../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {DSTestPlus} from "../../utils/DSTestPlus.sol";

bool constant DEBUG = false;

contract ProviderTest is DSTestPlus {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 mainnetFork;

  IVault public vault;
  ILendingProvider public aaveV2;

  IWETH9 public weth;
  IERC20 public usdc;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    mainnetFork = vm.createSelectFork("mainnet");

    weth = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");
    vm.label(address(weth), "weth");
    vm.label(address(usdc), "usdc");

    MockOracle mockOracle = new MockOracle();

    mockOracle.setPriceOf(address(weth), address(usdc), 62500);
    mockOracle.setPriceOf(address(usdc), address(weth), 160000000000);

    vault = new BorrowingVault(
      address(weth),
      address(usdc),
      address(mockOracle),
      address(0)
    );

    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;
    vault.setProviders(providers);
    vault.setActiveProvider(aaveV2);
  }

  function _utils_doDepositRoutine(address who, uint256 amount) internal {
    vm.startPrank(who);
    SafeERC20.safeApprove(IERC20(address(weth)), address(vault), amount);
    vault.deposit(amount, who);
    assertEq(vault.balanceOf(who), amount);
    vm.stopPrank();
  }

  function _utils_doBorrowRoutine(address who, uint256 amount) internal {
    vm.startPrank(who);
    vault.borrow(amount, who, who);
    assertEq(usdc.balanceOf(who), amount);
    vm.stopPrank();
  }

  function _utils_doPaybackRoutine(address who, uint256 amount) internal {
    vm.startPrank(who);
    uint256 prevDebt = vault.balanceOfDebt(who);
    SafeERC20.safeApprove(IERC20(address(usdc)), address(vault), amount);
    vault.payback(amount, who);
    uint256 debtDiff = prevDebt - amount;
    assertEq(vault.balanceOfDebt(who), debtDiff);
    vm.stopPrank();
  }

  function _utils_doWithdrawRoutine(address who, uint256 amount) internal {
    vm.startPrank(who);
    uint256 prevAssets = vault.convertToAssets(vault.balanceOf(who));
    vault.withdraw(amount, who, who);
    uint256 diff = prevAssets - amount;
    assertEq(vault.convertToAssets(vault.balanceOf(who)), diff);
    vm.stopPrank();
  }

  function test_depositAndBorrow() public {
    deal(address(weth), alice, DEPOSIT_AMOUNT);

    _utils_doDepositRoutine(alice, DEPOSIT_AMOUNT);
    _utils_doBorrowRoutine(alice, BORROW_AMOUNT);
  }

  function test_paybackAndWithdraw() public {
    deal(address(weth), alice, DEPOSIT_AMOUNT);

    _utils_doDepositRoutine(alice, DEPOSIT_AMOUNT);
    _utils_doBorrowRoutine(alice, BORROW_AMOUNT);

    uint256 aliceDebt = vault.balanceOfDebt(alice);
    _utils_doPaybackRoutine(alice, aliceDebt);

    uint256 maxAmount = vault.maxWithdraw(alice);
    _utils_doWithdrawRoutine(alice, maxAmount);
  }

  function test_getBalances() public {
    deal(address(weth), alice, DEPOSIT_AMOUNT);
    _utils_doDepositRoutine(alice, DEPOSIT_AMOUNT);
    _utils_doBorrowRoutine(alice, BORROW_AMOUNT);
    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT);
    assertGe(borrowBalance, BORROW_AMOUNT);
    if (DEBUG) {
      console.log("depositBalance", depositBalance);
      console.log("borrowBalance", borrowBalance);
    }
  }

  function test_getInterestRates() public {
    uint256 depositRate = aaveV2.getDepositRateFor(address(weth), address(0));
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = aaveV2.getBorrowRateFor(address(usdc), address(0));
    assertGt(borrowRate, 0); // Should be greater than zero.

    if (DEBUG) {
      console.log("depositRate", depositRate);
      console.log("borrowRate", borrowRate);
    }
  }
}
