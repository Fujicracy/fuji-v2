// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BaseVault} from "../src/abstracts/BaseVault.sol";

contract VaultTest is DSTestPlus {
  event MinDepositAmountChanged(uint256 newMinDeposit);
  event DepositCapChanged(uint256 newDepositCap);

  IVault public vault;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);

  uint256 bobPkey = 0xB;
  address bob = vm.addr(bobPkey);

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    _utils_setupOracle(address(asset), address(debtAsset));

    mockProvider = new MockProvider();

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(0)
    );

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    vault.setProviders(providers);
    vault.setActiveProvider(mockProvider);
  }

  function _utils_setPrice(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_setupOracle(address asset1, address asset2) internal {
    // WETH and DAI prices: 2000 DAI/WETH
    _utils_setPrice(asset1, asset2, 5e14);
    _utils_setPrice(asset2, asset1, 2000e18);
  }

  function _utils_doDeposit(uint256 amount, IVault v, address who) internal {
    deal(address(asset), who, amount);

    vm.startPrank(who);
    SafeERC20.safeApprove(asset, address(v), amount);
    v.deposit(amount, who);
    vm.stopPrank();
  }

  function _utils_doDepositAndBorrow(
    uint256 depositAmount,
    uint256 borrowAmount,
    IVault v,
    address who
  )
    internal
  {
    _utils_doDeposit(depositAmount, v, who);
    vm.prank(who);
    v.borrow(borrowAmount, who, who);
  }

  //fuzz testing example
  function test_deposit(uint256 amount) public {
    _utils_doDeposit(amount, vault, alice);
    assertEq(vault.balanceOf(alice), amount);
  }

  function test_withdraw() public {
    uint256 amount = 2 ether;
    _utils_doDeposit(amount, vault, alice);

    vm.prank(alice);
    vault.withdraw(amount, alice, alice);

    assertEq(vault.balanceOf(alice), 0);
  }

  function test_depositAndBorrow() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;

    assertEq(vault.totalDebt(), 0);
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    assertEq(vault.totalDebt(), borrowAmount);
    assertEq(debtAsset.balanceOf(alice), borrowAmount);
  }

  function test_paybackAndWithdraw() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;

    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    vm.startPrank(alice);
    SafeERC20.safeApprove(debtAsset, address(vault), borrowAmount);
    assertEq(vault.totalDebt(), borrowAmount);
    vault.payback(borrowAmount, alice);
    assertEq(vault.totalDebt(), 0);
    vault.withdraw(amount, alice, alice);
    vm.stopPrank();

    assertEq(vault.balanceOf(alice), 0);
  }

  function test_tryBorrowWithoutCollateral() public {
    uint256 borrowAmount = 100e18;
    vm.expectRevert(BorrowingVault.BorrowingVault__borrow_moreThanAllowed.selector);

    vm.prank(alice);
    vault.borrow(borrowAmount, alice, alice);
  }

  function test_tryWithdrawWithoutRepay() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    vm.expectRevert(BaseVault.BaseVault__withdraw_moreThanMax.selector);

    vm.prank(alice);
    vault.withdraw(amount, alice, alice);
  }

  function test_setMinDeposit() public {
    uint256 min = 0.1 ether;
    vm.expectEmit(true, false, false, false);
    emit MinDepositAmountChanged(min);
    vault.setMinDepositAmount(min);
  }

  function test_tryLessThanMinDeposit() public {
    uint256 min = 0.1 ether;
    vault.setMinDepositAmount(min);

    uint256 amount = 0.05 ether;
    vm.expectRevert(BaseVault.BaseVault__deposit_lessThanMin.selector);
    vm.prank(alice);
    vault.deposit(amount, alice);
  }

  function test_setMaxCap() public {
    uint256 maxCap = 5 ether;
    vm.expectEmit(true, false, false, false);
    emit DepositCapChanged(maxCap);
    vault.setDepositCap(maxCap);
  }

  function test_tryMaxCap() public {
    uint256 maxCap = 5 ether;
    vault.setDepositCap(maxCap);

    uint256 depositAlice = 4.5 ether;
    _utils_doDeposit(depositAlice, vault, alice);

    uint256 depositBob = 1 ether;
    vm.expectRevert(BaseVault.BaseVault__deposit_moreThanMax.selector);
    vm.prank(bob);
    vault.deposit(depositBob, bob);
  }

  function test_getHealthFactor() public {
    uint256 HF = vault.getHealthFactor(alice);
    assertEq(HF, type(uint256).max);

    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    uint256 HF2 = vault.getHealthFactor(alice);
    assertEq(HF2, 3200);
  }

  function test_getLiquidationFactor() public {
    uint256 liquidatorFactor_0 = vault.getLiquidationFactor(alice);
    assertEq(liquidatorFactor_0, 0);

    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    uint256 liquidatorFactor_1 = vault.getLiquidationFactor(alice);
    assertEq(liquidatorFactor_1, 0);

    _utils_setPrice(address(debtAsset), address(asset), 1225 * 1e18);

    uint256 liquidatorFactor_2 = vault.getLiquidationFactor(alice);
    assertEq(liquidatorFactor_2, 0.5e18);

    _utils_setPrice(address(debtAsset), address(asset), 1000 * 1e18);

    uint256 liquidatorFactor_3 = vault.getLiquidationFactor(alice);
    assertEq(liquidatorFactor_3, 1e18);
  }

  function test_tryLiquidateHealthy() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 900e18;
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    // Alice's position is still healthy (price 1889*1e18) so expect a liquidation call to revert:
    vm.expectRevert(BorrowingVault.BorrowingVault__liquidate_positionHealthy.selector);
    vm.prank(bob);
    vault.liquidate(alice);
  }

  function test_liquidateMax() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 900e18;
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    // price drop from 1889*1e18 to 1000*1e18
    _utils_setPrice(address(asset), address(debtAsset), 1000000000000000);
    _utils_setPrice(address(debtAsset), address(asset), 1000e18);
    uint256 liquidatorAmount = 2000e18;
    deal(address(debtAsset), bob, liquidatorAmount);

    assertEq(asset.balanceOf(alice), 0);
    assertEq(debtAsset.balanceOf(alice), borrowAmount);
    assertEq(vault.balanceOf(alice), amount);
    assertEq(vault.balanceOfDebt(alice), borrowAmount);

    assertEq(asset.balanceOf(bob), 0);
    assertEq(debtAsset.balanceOf(bob), liquidatorAmount);
    assertEq(vault.balanceOf(bob), 0);
    assertEq(vault.balanceOfDebt(bob), 0);

    vm.startPrank(bob);
    SafeERC20.safeApprove(debtAsset, address(vault), liquidatorAmount);
    vault.liquidate(alice);
    vm.stopPrank();

    assertEq(asset.balanceOf(alice), 0);
    assertEq(debtAsset.balanceOf(alice), borrowAmount);
    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.balanceOfDebt(alice), 0);

    assertEq(asset.balanceOf(bob), 0);
    assertEq(debtAsset.balanceOf(bob), liquidatorAmount - borrowAmount);
    assertEq(vault.balanceOf(bob), amount);
    assertEq(vault.balanceOfDebt(bob), 0);
  }

  function test_liquidateDefault() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;
    _utils_doDepositAndBorrow(amount, borrowAmount, vault, alice);

    // price drop, putting HF < 100, but above 95 and the close factor at 50%
    _utils_setPrice(address(asset), address(debtAsset), 806451612903226);
    _utils_setPrice(address(debtAsset), address(asset), 1240e18);
    uint256 liquidatorAmount = 2000e18;
    deal(address(debtAsset), bob, liquidatorAmount);

    assertEq(asset.balanceOf(alice), 0);
    assertEq(debtAsset.balanceOf(alice), borrowAmount);
    assertEq(vault.balanceOf(alice), amount);
    assertEq(vault.balanceOfDebt(alice), borrowAmount);

    assertEq(asset.balanceOf(bob), 0);
    assertEq(debtAsset.balanceOf(bob), liquidatorAmount);
    assertEq(vault.balanceOf(bob), 0);
    assertEq(vault.balanceOfDebt(bob), 0);

    vm.startPrank(bob);
    SafeERC20.safeApprove(debtAsset, address(vault), liquidatorAmount);
    vault.liquidate(alice);
    vm.stopPrank();

    assertEq(asset.balanceOf(alice), 0);
    assertEq(debtAsset.balanceOf(alice), borrowAmount);
    assertEq(vault.balanceOf(alice), 551971326164874552);
    assertEq(vault.balanceOfDebt(alice), borrowAmount / 2);

    assertEq(asset.balanceOf(bob), 0);
    assertEq(debtAsset.balanceOf(bob), liquidatorAmount - borrowAmount / 2);
    assertEq(vault.balanceOf(bob), 448028673835125448);
    assertEq(vault.balanceOfDebt(bob), 0);
  }
}
