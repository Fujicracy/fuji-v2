// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {BaseVault} from "../../../src/abstracts/BaseVault.sol";

contract VaultUnitTests is MockingSetup, MockRoutines {
  event MinAmountChanged(uint256 newMinAmount);
  event DepositCapChanged(uint256 newDepositCap);

  uint8 public constant DEBT_DECIMALS = 18;
  uint8 public constant ASSET_DECIMALS = 18;

  function setUp() public {
    _grantRoleChief(LIQUIDATOR_ROLE, BOB);
  }

  function mock_setPriceOf(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_getHealthFactor(
    uint96 amount,
    uint96 borrowAmount
  )
    internal
    view
    returns (uint256)
  {
    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    return (amount * DEFAULT_LIQ_RATIO * price) / (borrowAmount * 10 ** ASSET_DECIMALS);
  }

  function _utils_getFutureHealthFactor(
    uint96 amount,
    uint96 borrowAmount,
    uint80 priceDrop
  )
    internal
    view
    returns (uint256)
  {
    uint256 priceBefore = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    return (amount * DEFAULT_LIQ_RATIO * (priceBefore - priceDrop))
      / (borrowAmount * 1e16 * 10 ** ASSET_DECIMALS);
  }

  function get_PriceDropToLiquidation(
    uint256 price,
    uint256 deposit,
    uint256 borrowAmount
  )
    internal
    pure
    returns (uint256)
  {
    require(
      price / 1e18 > 0 && deposit / 1e18 > 0 && borrowAmount / 1e18 > 0,
      "Price, deposit, and borrowAmount should be 1e18"
    );
    return (price - ((borrowAmount * 1e36) / (deposit * DEFAULT_LIQ_RATIO)));
  }

  function _utils_checkLiquidateMaxFuture(
    uint96 amount,
    uint96 borrowAmount,
    uint80 priceDrop
  )
    internal
    view
    returns (bool)
  {
    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    uint256 hf = (amount * DEFAULT_LIQ_RATIO * (price - priceDrop))
      / (borrowAmount * 1e18 * 10 ** ASSET_DECIMALS);

    return hf <= 95;
  }

  function _utils_checkLiquidateDiscountFuture(
    uint96 amount,
    uint96 borrowAmount,
    uint80 priceDrop
  )
    internal
    view
    returns (bool)
  {
    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    uint256 hf = (amount * DEFAULT_LIQ_RATIO * (price - priceDrop))
      / (borrowAmount * 1e18 * 10 ** ASSET_DECIMALS);

    return hf > 95 && hf < 100;
  }

  function _utils_add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a && c >= b);
    return c;
  }

  function test_deposit(uint128 amount) public {
    vm.assume(amount > vault.minAmount());
    do_deposit(amount, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), amount);
  }

  function test_mint(uint128 shares) public {
    vm.assume(shares > vault.minAmount());
    do_mint(shares, vault, ALICE);
    assertEq(vault.balanceOf(ALICE), shares);
  }

  function test_withdraw(uint96 amount) public {
    vm.assume(amount > vault.minAmount());
    do_deposit(amount, vault, ALICE);
    do_withdraw(amount, vault, ALICE);
  }

  function test_redeem(uint128 shares) public {
    vm.assume(shares > vault.minAmount());
    do_mint(shares, vault, ALICE);
    do_redeem(shares, vault, ALICE);
  }

  function test_depositAndBorrow(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    assertEq(vault.totalDebt(), borrowAmount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_depositThenMintDebt(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );

    do_deposit(amount, vault, ALICE);
    uint256 debtShares = vault.previewBorrow(borrowAmount);

    do_mintDebt(debtShares, vault, ALICE);

    assertEq(vault.totalDebt(), borrowAmount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_paybackAndWithdraw(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    do_payback(borrowAmount, vault, ALICE);
    do_withdraw(amount, vault, ALICE);

    assertEq(vault.balanceOfDebt(ALICE), 0);
    assertEq(vault.balanceOf(ALICE), 0);
  }

  function test_burnDebtThenWithdraw(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    uint256 debtShares = vault.balanceOfDebtShares(ALICE);

    do_burnDebt(debtShares, vault, ALICE);
    do_withdraw(amount, vault, ALICE);

    assertEq(vault.balanceOfDebt(ALICE), 0);
    assertEq(vault.balanceOf(ALICE), 0);
  }

  function test_tryBorrowWithoutCollateral(uint256 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(borrowAmount > minAmount);
    vm.expectRevert(BorrowingVault.BorrowingVault__borrow_moreThanAllowed.selector);

    vm.prank(ALICE);
    vault.borrow(borrowAmount, ALICE, ALICE);
  }

  function test_tryWithdrawWithoutRepay(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );
    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    vm.expectRevert(BaseVault.BaseVault__withdraw_moreThanMax.selector);
    vm.prank(ALICE);
    vault.withdraw(amount, ALICE, ALICE);
  }

  function test_tryTransferWithoutRepay(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );
    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    vm.expectRevert(BorrowingVault.BorrowingVault__beforeTokenTransfer_moreThanMax.selector);
    vm.prank(ALICE);
    vault.transfer(BOB, uint256(amount));
  }

  function test_tryTransferMaxRedeemWithoutRepay(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );
    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);
    uint256 maxTransferable = vault.maxRedeem(ALICE);

    vm.prank(ALICE);
    vault.transfer(BOB, maxTransferable);
    assertEq(vault.balanceOf(BOB), maxTransferable);

    uint256 nonTransferable = amount - maxTransferable;

    vm.expectRevert(BorrowingVault.BorrowingVault__beforeTokenTransfer_moreThanMax.selector);
    vm.prank(ALICE);
    vault.transfer(BOB, nonTransferable);

    // Bob's shares haven't change.
    assertEq(vault.balanceOf(BOB), maxTransferable);
  }

  function test_setMinAmount(uint256 min) public {
    vm.prank(chief.timelock());
    vm.expectEmit(true, false, false, false);
    emit MinAmountChanged(min);
    vault.setMinAmount(min);
  }

  function test_tryLessThanMinAmount(uint128 min, uint128 amount) public {
    vm.assume(min > 0 && amount > 0 && amount < min);
    bytes memory encodedWithSelectorData = abi.encodeWithSelector(vault.setMinAmount.selector, min);
    _callWithTimelock(address(vault), encodedWithSelectorData);

    vm.expectRevert(BaseVault.BaseVault__deposit_lessThanMin.selector);
    vm.prank(ALICE);
    vault.deposit(amount, ALICE);
  }

  function test_setMaxCap(uint256 maxCap) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(maxCap > minAmount);

    vm.prank(chief.timelock());
    vm.expectEmit(true, false, false, false);
    emit DepositCapChanged(maxCap);
    vault.setDepositCap(maxCap);
  }

  function test_tryMaxCap(uint256 maxCap, uint96 depositAlice, uint96 depositBob) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      maxCap > minAmount && depositAlice > minAmount && depositBob > minAmount
        && _utils_add(depositBob, depositAlice) > maxCap && depositAlice < maxCap
    );
    bytes memory encodedWithSelectorData =
      abi.encodeWithSelector(vault.setDepositCap.selector, maxCap);
    _callWithTimelock(address(vault), encodedWithSelectorData);

    do_deposit(depositAlice, vault, ALICE);

    vm.expectRevert(BaseVault.BaseVault__deposit_moreThanMax.selector);
    vm.prank(BOB);
    vault.deposit(depositBob, BOB);
  }

  function test_maxCapChecks(uint256 maxCap, uint96 firstDeposit, uint96 secondDeposit) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      maxCap > minAmount && firstDeposit > minAmount && secondDeposit > minAmount
        && _utils_add(firstDeposit, secondDeposit) < maxCap
    );

    bytes memory encodedWithSelectorData =
      abi.encodeWithSelector(vault.setDepositCap.selector, maxCap);
    _callWithTimelock(address(vault), encodedWithSelectorData);

    do_deposit(firstDeposit, vault, ALICE);
    do_deposit(secondDeposit, vault, ALICE);
  }

  function test_getHealthFactor(uint40 amount, uint40 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );

    uint256 HF = vault.getHealthFactor(ALICE);
    assertEq(HF, type(uint256).max);

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    uint256 HF2 = vault.getHealthFactor(ALICE);
    uint256 HF2_ = _utils_getHealthFactor(amount, borrowAmount);

    assertEq(HF2, HF2_);
  }

  function test_getLiquidationFactor(uint256 priceDrop) public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;
    // Make price in 1e18 decimals.
    uint256 scaledUSDPerETHPrice = USD_PER_ETH_PRICE * 1e10;
    vm.assume(priceDrop > get_PriceDropToLiquidation(scaledUSDPerETHPrice, amount, borrowAmount));
    // This bounds priceDrop using 788e18
    // It means ETH price is dropping anywhere between $788 usd/ETH and USD_PER_ETH_PRICE
    priceDrop = bound(priceDrop, 788e18, scaledUSDPerETHPrice);

    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, 18);

    uint256 priceDropThresholdToMaxLiq =
      price - ((95e16 * borrowAmount * 1e18) / (amount * DEFAULT_LIQ_RATIO));

    uint256 liquidatorFactor_0 = vault.getLiquidationFactor(ALICE);
    assertEq(liquidatorFactor_0, 0);

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    uint256 liquidatorFactor_1 = vault.getLiquidationFactor(ALICE);
    assertEq(liquidatorFactor_1, 0);

    if (priceDrop > priceDropThresholdToMaxLiq) {
      uint256 newPrice = (price - priceDrop);
      mock_setPriceOf(debtAsset, collateralAsset, newPrice);
      uint256 liquidatorFactor = vault.getLiquidationFactor(ALICE);
      assertEq(liquidatorFactor, 1e18);
    } else {
      uint256 newPrice = (price - priceDrop);
      mock_setPriceOf(debtAsset, collateralAsset, newPrice);
      uint256 liquidatorFactor = vault.getLiquidationFactor(ALICE);
      assertEq(liquidatorFactor, 0.5e18);
    }
  }

  function test_tryLiquidateHealthy(uint96 amount, uint96 borrowAmount) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );
    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    vm.expectRevert(BorrowingVault.BorrowingVault__liquidate_positionHealthy.selector);
    vm.prank(BOB);
    vault.liquidate(ALICE, BOB);
  }

  function test_liquidateMax(uint256 borrowAmount) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 minAmount = (vault.minAmount() * currentPrice) / 1e18;

    vm.assume(borrowAmount > minAmount && borrowAmount < USD_PER_ETH_PRICE);

    uint256 maxltv = vault.maxLtv();
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, ALICE);

    // Simulate 90% price drop
    uint256 liquidationPrice = (currentPrice * 10) / 100;
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

    mock_setPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_setPriceOf(debtAsset, collateralAsset, liquidationPrice);

    _dealMockERC20(debtAsset, BOB, borrowAmount);

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), unsafeAmount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);

    assertEq(IERC20(collateralAsset).balanceOf(BOB), 0);
    assertEq(IERC20(debtAsset).balanceOf(BOB), borrowAmount);
    assertEq(vault.balanceOf(BOB), 0);
    assertEq(vault.balanceOfDebt(BOB), 0);

    vm.startPrank(BOB);
    IERC20(debtAsset).approve(address(vault), borrowAmount);
    vault.liquidate(ALICE, BOB);
    vm.stopPrank();

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    assertEq(IERC20(collateralAsset).balanceOf(BOB), 0);
    assertEq(IERC20(debtAsset).balanceOf(BOB), 0);
    assertEq(vault.balanceOf(BOB), unsafeAmount);
    assertEq(vault.balanceOfDebt(BOB), 0);
  }

  function test_liquidateDefault(uint256 priceDrop) public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    // Make price in 1e18 decimals.
    uint256 scaledUSDPerETHPrice = USD_PER_ETH_PRICE * 1e10;

    vm.assume(priceDrop > get_PriceDropToLiquidation(scaledUSDPerETHPrice, amount, borrowAmount));

    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 priceDropThresholdToMaxLiq =
      price - ((95e16 * borrowAmount * 1e18) / (amount * DEFAULT_LIQ_RATIO));
    uint256 priceDropThresholdToDiscountLiq =
      price - ((100e16 * borrowAmount * 1e18) / (amount * DEFAULT_LIQ_RATIO));

    //priceDrop between thresholds
    priceDrop =
      bound(priceDrop, priceDropThresholdToDiscountLiq + 1, priceDropThresholdToMaxLiq - 1);

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    // price drop, putting HF < 100, but above 95 and the close factor at 50%
    uint256 newPrice = price - priceDrop;

    mock_setPriceOf(collateralAsset, debtAsset, 1e18 / newPrice);
    mock_setPriceOf(debtAsset, collateralAsset, newPrice);
    uint256 liquidatorAmount = borrowAmount;
    _dealMockERC20(debtAsset, BOB, liquidatorAmount);

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);
    assertEq(IERC20(collateralAsset).balanceOf(BOB), 0);
    assertEq(IERC20(debtAsset).balanceOf(BOB), liquidatorAmount);
    assertEq(vault.balanceOf(BOB), 0);
    assertEq(vault.balanceOfDebt(BOB), 0);

    vm.startPrank(BOB);
    IERC20(debtAsset).approve(address(vault), liquidatorAmount);
    vault.liquidate(ALICE, BOB);
    vm.stopPrank();

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);

    uint256 discountedPrice = (newPrice * 0.9e18) / 1e18;
    uint256 amountGivenToLiquidator = (borrowAmount * 0.5e18) / discountedPrice;

    if (amountGivenToLiquidator >= amount) {
      amountGivenToLiquidator = amount;
    }

    assertEq(vault.balanceOf(ALICE), amount - amountGivenToLiquidator);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount / 2);

    assertEq(IERC20(collateralAsset).balanceOf(BOB), 0);
    assertEq(IERC20(debtAsset).balanceOf(BOB), liquidatorAmount - (borrowAmount / 2));
    assertEq(vault.balanceOf(BOB), amountGivenToLiquidator);
    assertEq(vault.balanceOfDebt(BOB), 0);
  }

  //error BorrowingVault__borrow_invalidInput();
  function test_borrowInvalidInput() public {
    uint256 borrowAmount = 1000e18;
    uint256 invalidBorrowAmount = 0;
    address invalidAddress = address(0);

    //invalid debt
    vm.expectRevert(BorrowingVault.BorrowingVault__borrow_invalidInput.selector);
    vault.borrow(invalidBorrowAmount, ALICE, BOB);

    //invalid receiver
    vm.expectRevert(BorrowingVault.BorrowingVault__borrow_invalidInput.selector);
    vault.borrow(borrowAmount, invalidAddress, BOB);

    //invalid owner
    vm.expectRevert(BorrowingVault.BorrowingVault__borrow_invalidInput.selector);
    vault.borrow(borrowAmount, ALICE, invalidAddress);
  }

  //error BorrowingVault__borrow_moreThanAllowed();
  function test_borrowMoreThanAllowed(uint96 invalidBorrowAmount) public {
    uint96 amount = 1 ether;
    vm.assume(invalidBorrowAmount > 0 && !_utils_checkMaxLTV(amount, invalidBorrowAmount));

    do_deposit(amount, vault, ALICE);

    vm.expectRevert(BorrowingVault.BorrowingVault__borrow_moreThanAllowed.selector);
    vault.borrow(invalidBorrowAmount, ALICE, ALICE);
  }

  //error BorrowingVault__payback_invalidInput();
  function test_paybackInvalidInput() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;
    uint256 invalidDebt = 0;

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    //invalid debt
    vm.expectRevert(BorrowingVault.BorrowingVault__payback_invalidInput.selector);
    vault.payback(invalidDebt, ALICE);

    //invalid owner
    vm.expectRevert(BorrowingVault.BorrowingVault__payback_invalidInput.selector);
    vault.payback(borrowAmount, address(0));
  }

  //error BorrowingVault__payback_moreThanMax();
  function test_paybackMoreThanMax(uint256 amountPayback) public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;
    vm.assume(amountPayback > borrowAmount);

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    vm.expectRevert(BorrowingVault.BorrowingVault__payback_moreThanMax.selector);
    vault.payback(amountPayback, ALICE);
  }

  //error BorrowingVault__liquidate_invalidInput();
  function test_liquidateInvalidInput() public {
    vm.expectRevert(BorrowingVault.BorrowingVault__liquidate_invalidInput.selector);
    vault.liquidate(ALICE, address(0));
  }
}
