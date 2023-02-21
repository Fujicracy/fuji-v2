// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {MockFlasher} from "../../../src/mocks/MockFlasher.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {MockSwapper} from "../../../src/mocks/MockSwapper.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {YieldVault} from "../../../src/vaults/yield/YieldVault.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {LiquidationManager} from "../../../src/LiquidationManager.sol";

contract VaultLiquidationUnitTests is MockingSetup, MockRoutines {
  // BorrowingVault public vault;
  // YieldVault public yieldVault;

  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);

  MockFlasher public flasher;

  LiquidationManager public liquidationManager;

  uint8 public constant DEBT_DECIMALS = 18;
  uint8 public constant ASSET_DECIMALS = 18;
  uint256 public constant LIQUIDATION_RATIO = 80 * 1e16;

  function setUp() public {
    // _grantRoleChief(LIQUIDATOR_ROLE, BOB);

    // mockProviderA = new MockProviderIdA();
    // vm.label(address(mockProviderA), "ProviderA");
    //
    // ILendingProvider[] memory providers = new ILendingProvider[](1);
    // providers[0] = mockProviderA;

    // bvault = new BorrowingVault(
    //   collateralAsset,
    //   debtAsset,
    //   address(oracle),
    //   address(chief),
    //   "Fuji-V2 tWETH-tDAI BorrowingVault",
    //   "fbvtWETHtDAI",
    //   providers
    // );

    // yvault = new YieldVault(
    //   collateralAsset,
    //   address(chief),
    //   "Fuji-V2 tWETH YieldVault",
    //   "fyvtWETH",
    //   providers
    // );

    flasher = new MockFlasher();
    // bytes memory executionCall =
    //   abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    // _callWithTimelock(address(chief), executionCall);

    ISwapper swapper = new MockSwapper(oracle);
    liquidationManager = new LiquidationManager(address(chief), TREASURY, address(swapper));
    _grantRoleChief(LIQUIDATOR_ROLE, address(liquidationManager));
    // executionCall =
    //   abi.encodeWithSelector(chief.grantRole.selector, LIQUIDATOR_ROLE, address(liquidationManager));
    // _callWithTimelock(address(chief), executionCall);

    bytes memory executionCall =
      abi.encodeWithSelector(liquidationManager.allowExecutor.selector, address(this), true);
    _callWithTimelock(address(liquidationManager), executionCall);

    // do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, ALICE);
    // do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, BOB);
    // do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, CHARLIE);
    // do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, DAVID);
    //
    // do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
    // do_deposit(DEPOSIT_AMOUNT, yvault, BOB);
    // do_deposit(DEPOSIT_AMOUNT, yvault, CHARLIE);
    // do_deposit(DEPOSIT_AMOUNT, yvault, DAVID);
  }

  function mock_getPriceOf(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_getLiquidationThresholdValue(
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
    return (price - ((borrowAmount * 1e36) / (deposit * LIQUIDATION_RATIO)));
  }

  function _utils_checkMaxLTV(uint256 amount, uint256 borrowAmount) internal view returns (bool) {
    uint256 maxLtv = 75 * 1e16;

    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    uint256 maxBorrow = (amount * maxLtv * price) / (1e18 * 10 ** ASSET_DECIMALS);
    return borrowAmount < maxBorrow;
  }

  function test_liquidateMax( /*uint256 borrowAmount*/ ) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 minAmount = (vault.minAmount() * currentPrice) / 1e18;

    uint256 borrowAmount = USD_PER_ETH_PRICE - 1;
    // vm.assume(borrowAmount > minAmount && borrowAmount < USD_PER_ETH_PRICE);

    uint256 maxltv = vault.maxLtv();
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, ALICE);

    // Simulate 90% price drop
    uint256 liquidationPrice = (currentPrice * 10) / 100;
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

    mock_getPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_getPriceOf(debtAsset, collateralAsset, liquidationPrice);

    address[] memory users = new address[](1);
    users[0] = ALICE;

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), unsafeAmount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);

    //TODO
    //check balance of treasury

    liquidationManager.liquidate(users, vault, flasher);

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //TODO
    //check balance of treasury
  }

  function test_liquidateDefault(uint256 priceDrop) public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    // Make price in 1e18 decimals.
    uint256 scaledUSDPerETHPrice = USD_PER_ETH_PRICE * 1e10;

    vm.assume(
      priceDrop > _utils_getLiquidationThresholdValue(scaledUSDPerETHPrice, amount, borrowAmount)
    );

    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 priceDropThresholdToMaxLiq =
      price - ((95e16 * borrowAmount * 1e18) / (amount * LIQUIDATION_RATIO));
    uint256 priceDropThresholdToDiscountLiq =
      price - ((100e16 * borrowAmount * 1e18) / (amount * LIQUIDATION_RATIO));

    //priceDrop between thresholds
    priceDrop =
      bound(priceDrop, priceDropThresholdToDiscountLiq + 1, priceDropThresholdToMaxLiq - 1);

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    // price drop, putting HF < 100, but above 95 and the close factor at 50%
    uint256 newPrice = price - priceDrop;

    mock_getPriceOf(collateralAsset, debtAsset, 1e18 / newPrice);
    mock_getPriceOf(debtAsset, collateralAsset, newPrice);
    // uint256 liquidatorAmount = borrowAmount;
    // _dealMockERC20(debtAsset, BOB, liquidatorAmount);

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);

    //TODO
    //check balance of treasury

    address[] memory users = new address[](1);
    users[0] = ALICE;

    liquidationManager.liquidate(users, vault, flasher);

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);

    uint256 discountedPrice = (newPrice * 0.9e18) / 1e18;
    uint256 amountGivenToLiquidator = (borrowAmount * 0.5e18) / discountedPrice;

    if (amountGivenToLiquidator >= amount) {
      amountGivenToLiquidator = amount;
    }

    assertEq(vault.balanceOf(ALICE), amount - amountGivenToLiquidator);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount / 2);

    //TODO
    //check balance of treasury
    // assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    // assertEq(IERC20(debtAsset).balanceOf(TREASURY), liquidatorAmount - (borrowAmount / 2));
    // assertEq(vault.balanceOf(TREASURY), amountGivenToLiquidator);
    // assertEq(vault.balanceOfDebt(TREASURY), 0);
  }

  function test_fail_liquidateYieldVault() public {}

  function test_liquidateOnlyHealthyUsers() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    uint256 minAmount = vault.minAmount();

    vm.assume(
      amount > minAmount && borrowAmount > minAmount && _utils_checkMaxLTV(amount, borrowAmount)
    );

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);
    do_depositAndBorrow(amount, borrowAmount, vault, BOB);
    do_depositAndBorrow(amount, borrowAmount, vault, CHARLIE);

    address[] memory users = new address[](4);
    users[0] = ALICE;
    users[1] = BOB;
    users[2] = CHARLIE;

    liquidationManager.liquidate(users, vault, flasher);
    vm.expectRevert(LiquidationManager.LiquidationManager__liquidate_noUsersToLiquidate.selector);
  }

  //should not revert if at one user is liquidatable
  function test_liquidateOnlyOneUserHealthy() public {}
}
