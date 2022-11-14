// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IWETH9} from "../../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {Chief} from "../../../src/Chief.sol";
import {CoreRoles} from "../../../src/access/CoreRoles.sol";
import {DSTestPlus} from "../../utils/DSTestPlus.sol";

bool constant DEBUG = false;

contract ProviderTest is DSTestPlus, CoreRoles {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 polygonFork;

  IVault public vault;
  ILendingProvider public aaveV3;
  Chief public chief;
  TimelockController public timelock;

  IWETH9 public weth;
  IERC20 public usdc;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 100e6;

  function setUp() public {
    polygonFork = vm.createSelectFork("polygon");

    weth = IWETH9(0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619);
    usdc = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");
    vm.label(address(weth), "weth");
    vm.label(address(usdc), "usdc");

    MockOracle mockOracle = new MockOracle();

    mockOracle.setPriceOf(address(weth), address(usdc), 62500);
    mockOracle.setPriceOf(address(usdc), address(weth), 160000000000);

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    vault = new BorrowingVault(
      address(weth),
      address(usdc),
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );

    aaveV3 = new AaveV3Polygon();

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3;

    _utils_setupVaultProvider(vault, providers);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(LIQUIDATOR_ROLE, address(this));
  }

  function _utils_callWithTimelock(bytes memory sendData, IVault vault_) internal {
    timelock.schedule(address(vault_), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(vault_), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProvider(IVault vault_, ILendingProvider[] memory providers_) internal {
    _utils_setupTestRoles();
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers_);
    _utils_callWithTimelock(sendData, vault_);
    vault_.setActiveProvider(providers_[0]);
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

    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1 minutes);

    uint256 aliceDebt = vault.balanceOfDebt(alice);
    deal(address(usdc), alice, aliceDebt); // ensure user has accrued interest to payback.
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
    uint256 depositRate = aaveV3.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = aaveV3.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.

    if (DEBUG) {
      console.log("depositRate", depositRate);
      console.log("borrowRate", borrowRate);
    }
  }
}
