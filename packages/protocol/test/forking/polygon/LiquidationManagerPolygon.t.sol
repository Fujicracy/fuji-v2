// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
// import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {FlasherBalancer} from "../../../src/flashloans/FlasherBalancer.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {LiquidationManager} from "../../../src/LiquidationManager.sol";
import {UniswapV2Swapper} from "../../../src/swappers/UniswapV2Swapper.sol";
import {IUniswapV2Router01} from "../../../src/interfaces/uniswap/IUniswapV2Router01.sol";
import {IFujiOracle} from "../../../src/interfaces/IFujiOracle.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {Routines} from "../../utils/Routines.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";

contract LiquidationManagerPolygonForkingTest is ForkingSetup, Routines {
  using Math for uint256;

  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);
  uint256 public constant KEEPER_PK = 0xE;
  address public KEEPER = vm.addr(KEEPER_PK);

  IFlasher public flasher;

  LiquidationManager public liquidationManager;

  uint8 public constant DEBT_DECIMALS = 18;
  uint8 public constant ASSET_DECIMALS = 18;
  uint256 public constant LIQUIDATION_RATIO = 80 * 1e16;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);
    flasher = new FlasherBalancer(0xBA12222222228d8Ba445958a75a0704d566BF2C8);
    // TODO make sure only allowed flashers can flash
    // bytes memory executionCall =
    //   abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    // _callWithTimelock(address(chief), executionCall);

    ILendingProvider aave = new AaveV2Polygon();

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aave;

    deployVault(
      registry[POLYGON_DOMAIN].weth, registry[POLYGON_DOMAIN].wmatic, "WETH", "WMATIC", providers
    );

    address quickSwap = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    vm.label(quickSwap, "QuickSwap");
    ISwapper swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(quickSwap));

    liquidationManager = new LiquidationManager(address(chief), TREASURY, address(swapper));
    _grantRoleChief(LIQUIDATOR_ROLE, address(liquidationManager));

    bytes memory executionCall =
      abi.encodeWithSelector(liquidationManager.allowExecutor.selector, address(KEEPER), true);
    _callWithTimelock(address(liquidationManager), executionCall);
  }

  function mock_getPriceOf(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(IFujiOracle.getPriceOf.selector, asset1, asset2, 18),
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

  function _utils_getFutureHealthFactor(
    uint256 amount,
    uint256 borrowAmount,
    uint256 priceDrop
  )
    internal
    view
    returns (uint256)
  {
    uint256 priceBefore = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    return (amount * LIQUIDATION_RATIO * (priceBefore - priceDrop))
      / (borrowAmount * 1e16 * 10 ** ASSET_DECIMALS);
  }

  function test_liquidateMax(uint256 borrowAmount) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 minAmount = (1e6 * currentPrice) / 1e18;

    console.log("minAmount", minAmount);
    console.log("oracleprice", oracle.getPriceOf(collateralAsset, debtAsset, 18));

    vm.assume(
      borrowAmount > minAmount && borrowAmount < oracle.getPriceOf(collateralAsset, debtAsset, 18)
    );

    uint256 maxltv = 75 * 1e16;
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    console.log("unsafeAmount", unsafeAmount);
    console.log("borrowAmount", borrowAmount);
    console.log("currentPrice", currentPrice);
    console.log("_utils_checkMaxLTV", _utils_checkMaxLTV(1000e18, borrowAmount));
    console.log("_utils_checkMaxLTV", _utils_checkMaxLTV(unsafeAmount, borrowAmount));

    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, ALICE);

    // Simulate 25% price drop
    // enough for user to be liquidated
    // liquidation is still profitable
    uint256 liquidationPrice = (currentPrice * 75) / 100;
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

    console.log(
      "future hf",
      _utils_getFutureHealthFactor(unsafeAmount, borrowAmount, currentPrice - liquidationPrice)
    );

    mock_getPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_getPriceOf(debtAsset, collateralAsset, liquidationPrice);

    console.log("hf after drop", vault.getHealthFactor(ALICE));

    console.log("assertions alice");
    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), unsafeAmount);
    // assertEq(vault.balanceOfDebt(ALICE), borrowAmount);

    console.log("assertions treasury");
    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);

    //liquidate ALICE
    address[] memory users = new address[](1);
    users[0] = ALICE;
    vm.startPrank(address(KEEPER));
    liquidationManager.liquidate(users, vault, flasher);
    vm.stopPrank();

    console.log("assertions alice after liquidation");
    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //check balance of treasury
    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, borrowAmount);
    uint256 collectedAmount = unsafeAmount - (borrowAmount * 1e18 / liquidationPrice)
      - (flashloanFee * 1e18 / liquidationPrice);

    console.log("assertions treasury after liquidation");
    // assertEq(IERC20(collateralAsset).balanceOf(TREASURY), collectedAmount);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
  }

  function test_liquidateDefault(uint256 priceDrop) public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    // Make price in 1e18 decimals.
    uint256 scaledUSDPerMATICPrice = oracle.getPriceOf(collateralAsset, debtAsset, 18) * 1e10;

    vm.assume(
      priceDrop > _utils_getLiquidationThresholdValue(scaledUSDPerMATICPrice, amount, borrowAmount)
    );

    console.log("1");
    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    console.log("1");
    uint256 priceDropThresholdToMaxLiq =
      price - ((95e16 * borrowAmount * 1e18) / (amount * LIQUIDATION_RATIO));
    console.log("1");
    uint256 priceDropThresholdToDiscountLiq =
      price - ((100e16 * borrowAmount * 1e18) / (amount * LIQUIDATION_RATIO));
    console.log("1");

    //priceDrop between thresholds
    priceDrop =
      bound(priceDrop, priceDropThresholdToDiscountLiq + 1, priceDropThresholdToMaxLiq - 1);

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    // price drop, putting HF < 100, but above 95 and the close factor at 50%
    uint256 newPrice = price - priceDrop;

    mock_getPriceOf(collateralAsset, debtAsset, 1e18 / newPrice);
    mock_getPriceOf(debtAsset, collateralAsset, newPrice);

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);

    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
    assertEq(vault.balanceOf(TREASURY), 0);
    assertEq(vault.balanceOfDebt(TREASURY), 0);

    //liquidate ALICE
    address[] memory users = new address[](1);
    users[0] = ALICE;

    vm.startPrank(address(KEEPER));
    liquidationManager.liquidate(users, vault, flasher);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);

    uint256 discountedPrice = (newPrice * 0.9e18) / 1e18;
    uint256 amountGivenToLiquidator = (borrowAmount * 0.5e18) / discountedPrice;

    if (amountGivenToLiquidator >= amount) {
      amountGivenToLiquidator = amount;
    }

    assertEq(vault.balanceOf(ALICE), amount - amountGivenToLiquidator);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount / 2);

    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, borrowAmount * 0.5e18 / newPrice);
    uint256 amountToRepayFlashloan = (borrowAmount * 0.5e18 / newPrice);

    //check balance of treasury
    assertEq(
      IERC20(collateralAsset).balanceOf(TREASURY), amountGivenToLiquidator - amountToRepayFlashloan
    );
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
    assertEq(vault.balanceOf(TREASURY), 0);
    assertEq(vault.balanceOfDebt(TREASURY), 0);
  }

  function test_liquidateOnlyHealthyUsers() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);
    do_depositAndBorrow(amount, borrowAmount, vault, BOB);
    do_depositAndBorrow(amount, borrowAmount, vault, CHARLIE);

    address[] memory users = new address[](4);
    users[0] = ALICE;
    users[1] = BOB;
    users[2] = CHARLIE;

    vm.expectRevert(LiquidationManager.LiquidationManager__liquidate_noUsersToLiquidate.selector);
    vm.startPrank(address(KEEPER));
    liquidationManager.liquidate(users, vault, flasher);
    vm.stopPrank();
  }

  //should not revert if at one user is liquidatable
  function test_liquidateOnlyOneUserLiquidatable(uint256 borrowAmount) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 minAmount = (10e6 * currentPrice) / 1e18;

    vm.assume(
      borrowAmount > minAmount && borrowAmount < oracle.getPriceOf(collateralAsset, debtAsset, 18)
    );

    uint256 maxltv = 75 * 1e16;
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, ALICE);
    do_depositAndBorrow(unsafeAmount * 10, borrowAmount, vault, BOB);
    do_depositAndBorrow(unsafeAmount * 10, borrowAmount, vault, CHARLIE);

    // Simulate 25% price drop
    // enough for user to be liquidated
    // liquidation is still profitable
    uint256 liquidationPrice = (currentPrice * 75) / 100;
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

    mock_getPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_getPriceOf(debtAsset, collateralAsset, liquidationPrice);

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), unsafeAmount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);

    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);

    //try liquidate all
    //only ALICE will be liquidated
    address[] memory users = new address[](3);
    users[0] = ALICE;
    users[1] = BOB;
    users[2] = CHARLIE;
    vm.startPrank(address(KEEPER));
    liquidationManager.liquidate(users, vault, flasher);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //check balance of treasury
    uint256 collectedAmount = unsafeAmount - (borrowAmount * 1e18 / liquidationPrice);

    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), collectedAmount);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
  }

  function test_unauthorizedKeeper() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    address[] memory users = new address[](1);
    users[0] = ALICE;

    vm.expectRevert(LiquidationManager.LiquidationManager__liquidate_notValidExecutor.selector);
    vm.startPrank(address(CHARLIE));
    liquidationManager.liquidate(users, vault, flasher);
    vm.stopPrank();
  }
}
