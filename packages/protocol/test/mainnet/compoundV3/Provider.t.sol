// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH9} from "../../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {CompoundV3} from "../../../src/providers/mainnet/CompoundV3.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {DSTestPlus} from "../../utils/DSTestPlus.sol";
import {IAddrMapper} from "../../../src/interfaces/IAddrMapper.sol";
import {AddrMapperDeployer} from "../../../src/helpers/AddrMapperDeployer.sol";

bool constant DEBUG = false;

interface ITestingCompoundV3 {
  function getMapper() external returns (address);
}

contract ProviderTest is DSTestPlus {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 mainnetFork;

  IVault public vault;
  IAddrMapper public mapper;
  ILendingProvider public compoundV3;

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

    AddrMapperDeployer mapDeployer = new AddrMapperDeployer();

    mapper = IAddrMapper(mapDeployer.deployAddrMapper("CompoundV3"));
    mapper.setNestedMapping(
      address(weth), address(usdc), 0xc3d688B66703497DAA19211EEdff47f25384cdc3
    );
    mapper.setNestedMapping(address(usdc), address(0), 0xc3d688B66703497DAA19211EEdff47f25384cdc3);

    vault = new BorrowingVault(
      address(weth),
      address(usdc),
      address(mockOracle),
      address(0)
    );

    compoundV3 = new CompoundV3();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV3;
    vault.setProviders(providers);
    vault.setActiveProvider(compoundV3);
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
  }

  function test_combinedGetBalances() public {
    ILendingProvider aaveV2;
    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = aaveV2;
    providers[1] = compoundV3;
    vault.setProviders(providers);

    deal(address(weth), alice, DEPOSIT_AMOUNT);
    _utils_doDepositRoutine(alice, DEPOSIT_AMOUNT);
    _utils_doBorrowRoutine(alice, BORROW_AMOUNT);

    vault.setActiveProvider(aaveV2);
    deal(address(weth), bob, DEPOSIT_AMOUNT);
    _utils_doDepositRoutine(bob, DEPOSIT_AMOUNT);
    _utils_doBorrowRoutine(bob, BORROW_AMOUNT);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT * 2);
    assertGe(borrowBalance, BORROW_AMOUNT * 2);
    if (DEBUG) {
      console.log("depositBalance", depositBalance);
      console.log("borrowBalance", borrowBalance);
    }
  }

  function test_getInterestRates() public {
    IAddrMapper _mapper = IAddrMapper(ITestingCompoundV3(address(compoundV3)).getMapper());
    address market = _mapper.getAddressNestedMapping(vault.asset(), vault.debtAsset());

    uint256 depositRate = compoundV3.getDepositRateFor(address(weth), market);
    assertEq(depositRate, 0); // Should be zero.

    uint256 borrowRate = compoundV3.getBorrowRateFor(address(usdc), market);
    assertGt(borrowRate, 0); // Should be greater than zero.

    if (DEBUG) {
      console.log("depositRate", depositRate);
      console.log("borrowRate", borrowRate);
    }
  }

  // This test is applicable only for CompoundV3
  function testFail_getInterestRatesWithNoMapping() public view returns (uint256) {
    return compoundV3.getDepositRateFor(address(weth), address(vault));
  }
}
