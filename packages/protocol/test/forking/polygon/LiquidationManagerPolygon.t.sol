// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
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
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract LiquidationManagerPolygonForkingTests is ForkingSetup, Routines {
  using Math for uint256;

  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);
  uint256 public constant KEEPER_PK = 0xE;
  address public KEEPER = vm.addr(KEEPER_PK);

  uint256 public user1_pk = 0x11;
  uint256 public user2_pk = 0x22;
  uint256 public user3_pk = 0x33;
  uint256 public user4_pk = 0x44;
  uint256 public user5_pk = 0x55;
  uint256 public user6_pk = 0x66;
  uint256 public user7_pk = 0x77;
  uint256 public user8_pk = 0x88;
  uint256 public user9_pk = 0x99;
  uint256 public user10_pk = 0x1010;

  IFlasher public flasher;
  ISwapper public swapper;

  LiquidationManager public liquidationManager;

  uint8 public constant DEBT_DECIMALS = 18;
  uint8 public constant ASSET_DECIMALS = 18;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    ILendingProvider aave = new AaveV2Polygon();

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aave;

    deployVault(
      registry[POLYGON_DOMAIN].weth, registry[POLYGON_DOMAIN].wmatic, "WETH", "WMATIC", providers
    );

    address quickSwap = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    vm.label(quickSwap, "QuickSwap");
    swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(quickSwap));
    flasher = new FlasherBalancer(0xBA12222222228d8Ba445958a75a0704d566BF2C8);

    liquidationManager = new LiquidationManager(address(chief), TREASURY);
    _grantRoleChief(LIQUIDATOR_ROLE, address(liquidationManager));

    bytes memory executionCall =
      abi.encodeWithSelector(liquidationManager.allowExecutor.selector, KEEPER, true);
    _callWithTimelock(address(liquidationManager), executionCall);

    executionCall = abi.encodeWithSelector(chief.allowSwapper.selector, address(swapper), true);
    _callWithTimelock(address(chief), executionCall);

    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);
  }

  function mock_getPriceOf(address currency, address commodity, uint256 priceIn18Decimals) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(IFujiOracle.getPriceOf.selector, currency, commodity, 18),
      abi.encode(priceIn18Decimals)
    );
  }

  function mock_getPriceOfWithDecimals(
    address currency,
    address commodity,
    uint256 priceIn18Decimals,
    uint256 currencyDecimals,
    uint256 commodityDecimals
  )
    internal
  {
    // require(
    //   price / 1e18 > 0,
    //   "For this to work, price has to be 1e18. Make sure asset1 is worth more than asset2"
    // );

    uint256 currencyPerCommodity = priceIn18Decimals;
    uint256 commodityPerCurrency = 1e36 / priceIn18Decimals; //this is in 18 decimals

    //price is in 1e18 -> make price in requested decimals by dividing by 10^(18-decimals)
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(IFujiOracle.getPriceOf.selector, currency, commodity, currencyDecimals),
      abi.encode(currencyPerCommodity / (10 ** (18 - currencyDecimals)))
    );

    //price is in 1e18 -> make price in requested decimals by dividing by 10^(18-decimals)
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(
        IFujiOracle.getPriceOf.selector, commodity, currency, commodityDecimals
      ),
      abi.encode(commodityPerCurrency / (10 ** (18 - commodityDecimals)))
    );
  }

  /**
   * @param vault_ in where owner is being liquidated
   * @param owner that is being liquidated
   */
  function estimate_gainedShares(
    BorrowingVault vault_,
    address owner
  )
    internal
    view
    returns (uint256 gainedShares)
  {
    uint256 debtRemaining;
    uint8 debtDecimals;
    uint8 assetDecimals;
    {
      // Compute `gainedShares` amount that the liquidator will receive.
      debtDecimals = vault_.debtDecimals();
      assetDecimals = IERC20Metadata(vault_.asset()).decimals();

      uint256 price = oracle.getPriceOf(vault_.debtAsset(), vault_.asset(), debtDecimals);
      uint256 discountedPrice = price.mulDiv(vault_.LIQUIDATION_PENALTY(), 1e18);
      uint256 debt = vault_.balanceOfDebt(owner);
      uint256 debtToCover = Math.mulDiv(debt, vault_.getLiquidationFactor(owner), 1e18);
      debtRemaining = vault_.balanceOfDebt(owner) - debtToCover;
      uint256 gainedAssets = Math.mulDiv(debtToCover, 10 ** assetDecimals, discountedPrice);
      gainedShares = vault_.convertToShares(gainedAssets);
    }
    uint256 redeemableShares;
    {
      uint256 invPrice = oracle.getPriceOf(vault_.asset(), vault_.debtAsset(), assetDecimals);
      uint256 lockedAssets =
        (debtRemaining * 1e18 * invPrice) / (vault_.maxLtv() * 10 ** debtDecimals);
      uint256 lockedShares = vault_.convertToShares(lockedAssets);
      redeemableShares = vault_.balanceOf(owner) - lockedShares;
    }
    if (gainedShares > redeemableShares) {
      gainedShares = redeemableShares;
    }
  }

  function estimate_liqManagerFlashloanPayback(
    IFlasher flasher_,
    IVault vault_,
    uint256 debt
  )
    internal
    view
    returns (uint256)
  {
    uint256 payback = debt + flasher_.computeFlashloanFee(vault_.debtAsset(), debt);
    return _utils_getAmountInSwap(vault_.asset(), vault_.debtAsset(), payback);
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
    return (price - ((borrowAmount * 1e36) / (deposit * DEFAULT_LIQ_RATIO)));
  }

  function _utils_getLiquidationThresholdValue(
    uint256 price,
    uint256 deposit,
    uint256 borrowAmount,
    uint256 depositDecimals,
    uint256 borrowDecimals
  )
    internal
    pure
    returns (uint256 threshold)
  {
    require(
      /*price / 1e18 > 0 && */
      deposit / 10 ** depositDecimals > 0 && borrowAmount / 10 ** borrowDecimals > 0,
      "Price, deposit, and borrowAmount should be according to decimals"
    );

    uint256 borrowDiff = 18 - borrowDecimals;
    uint256 depositDiff = 18 - depositDecimals;

    if (depositDecimals >= borrowDecimals) {
      if (price < borrowAmount * 10 ** borrowDiff) {
        threshold = (borrowAmount * 10 ** borrowDiff - price) * 1e36
          / (deposit * 10 ** depositDiff * DEFAULT_LIQ_RATIO);
      } else {
        threshold = (price - borrowAmount * 10 ** borrowDiff) * 1e36
          / (deposit * 10 ** depositDiff * DEFAULT_LIQ_RATIO);
      }
    } else {
      if (price < borrowAmount * 10 ** borrowDiff) {
        threshold = (borrowAmount * 10 ** borrowDiff - price) * 1e36
          / (deposit * 10 ** depositDiff * DEFAULT_LIQ_RATIO);
      } else {
        threshold = (price - borrowAmount * 10 ** borrowDiff) * 1e36
          / (deposit * 10 ** depositDiff * DEFAULT_LIQ_RATIO);
      }
    }
  }

  function _utils_checkMaxLTV(uint256 amount, uint256 borrowAmount) internal view returns (bool) {
    uint256 maxLtv = 75 * 1e16;

    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, DEBT_DECIMALS);
    uint256 maxBorrow = (amount * maxLtv * price) / (1e18 * 10 ** ASSET_DECIMALS);
    return borrowAmount < maxBorrow;
  }

  function _utils_getAmountInSwap(
    address assetIn,
    address assetOut,
    uint256 amountOut
  )
    internal
    view
    returns (uint256 amountIn)
  {
    amountIn = swapper.getAmountIn(assetIn, assetOut, amountOut);
  }

  function _utils_getAmountGivenToLiquidator(
    uint256 collateralAmount,
    uint256 borrowAmount,
    address collateralAsset,
    address debtAsset,
    uint256 price,
    uint256 discountedPrice
  )
    internal
    view
    returns (uint256 amount)
  {
    price =
      oracle.getPriceOf(collateralAsset, debtAsset, IERC20Metadata(collateralAsset).decimals());

    //amount of collateral given to liquidator
    //price is in 1e18 -> cancels 0.5e18
    //borrowAmount is in debt decimals -> cancelled by 10 ** debt decimals
    //we want amountGivenToLiquidator to be in collateral decimals so we multiply by collateral decimals
    amount = (borrowAmount * 0.5e18) * 10 ** IERC20Metadata(collateralAsset).decimals()
      / (discountedPrice * 10 ** IERC20Metadata(debtAsset).decimals());

    uint256 lockedAssets =
      (borrowAmount * 0.5e18 * price) / (0.75e18 * 10 ** IERC20Metadata(debtAsset).decimals());

    uint256 assets = collateralAmount;
    uint256 freeAssets = assets > lockedAssets ? assets - lockedAssets : 0;

    if (amount >= freeAssets) {
      amount = freeAssets;
    }
  }

  function test_liquidateMax(uint256 borrowAmount) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 minAmount = (1e6 * currentPrice) / 1e18;

    vm.assume(
      borrowAmount > minAmount && borrowAmount < oracle.getPriceOf(collateralAsset, debtAsset, 18)
    );

    uint256 maxltv = 75 * 1e16;
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, ALICE);

    // Simulate 25% price drop
    // enough for user to be liquidated
    // liquidation is still profitable
    uint256 liquidationPrice = (currentPrice * 75) / 100;
    uint256 inversePrice = 1e36 / liquidationPrice;

    mock_getPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_getPriceOf(debtAsset, collateralAsset, liquidationPrice);

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), unsafeAmount);
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), borrowAmount, 1);

    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);

    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, borrowAmount);
    uint256 collectedAmount =
      unsafeAmount - _utils_getAmountInSwap(collateralAsset, debtAsset, borrowAmount + flashloanFee);

    //liquidate ALICE
    address[] memory users = new address[](1);
    users[0] = ALICE;
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, borrowAmount + 3, flasher, swapper);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), 0);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //check balance of treasury
    assertApproxEqAbs(IERC20(collateralAsset).balanceOf(TREASURY), collectedAmount, 1);
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

    mock_getPriceOf(collateralAsset, debtAsset, 1e36 / newPrice);
    mock_getPriceOf(debtAsset, collateralAsset, newPrice);

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertEq(vault.balanceOf(ALICE), amount);
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), borrowAmount, 1);

    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
    assertEq(vault.balanceOf(TREASURY), 0);
    assertEq(vault.balanceOfDebt(TREASURY), 0);

    // liquidate ALICE
    uint256 gainedShares = estimate_gainedShares(BorrowingVault(payable(address(vault))), ALICE);

    address[] memory users = new address[](1);
    users[0] = ALICE;

    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, (borrowAmount * 0.5e18) / 1e18, flasher, swapper);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);

    assertEq(vault.balanceOf(ALICE), (amount - gainedShares));
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), (borrowAmount * 0.5e18) / 1e18, 1);

    // amount of collateral to pay flashloan back during liquidation through LiquidationManager
    uint256 collatPayback =
      estimate_liqManagerFlashloanPayback(flasher, vault, (borrowAmount * 0.5e18) / 1e18);

    // check balance of treasury
    assertGe(
      IERC20(collateralAsset).balanceOf(TREASURY),
      vault.convertToAssets(gainedShares) - collatPayback
    );
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
    assertEq(vault.balanceOf(TREASURY), 0);
    assertEq(vault.balanceOfDebt(TREASURY), 0);
  }

  function test_attemptLiquidateOnlyHealthyUsers() public {
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
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, 0, flasher, swapper);
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
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), borrowAmount, 2);

    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), 0);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);

    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, borrowAmount);
    uint256 collectedAmount =
      unsafeAmount - _utils_getAmountInSwap(collateralAsset, debtAsset, borrowAmount + flashloanFee);

    //try liquidate all
    //only ALICE will be liquidated
    address[] memory users = new address[](3);
    users[0] = ALICE;
    users[1] = BOB;
    users[2] = CHARLIE;
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, borrowAmount + 1, flasher, swapper);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertApproxEqAbs(vault.balanceOf(ALICE), 0, 1);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //check balance of treasury
    assertApproxEqAbs(IERC20(collateralAsset).balanceOf(TREASURY), collectedAmount, 2);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
  }

  //liquidate several users with the same hf
  function test_liquidateSeveralUsers(uint256 borrowAmount) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 minAmount = (1e6 * currentPrice) / 1e18;

    vm.assume(
      borrowAmount > minAmount && borrowAmount < oracle.getPriceOf(collateralAsset, debtAsset, 18)
    );

    uint256 maxltv = 75 * 1e16;
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, ALICE);
    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, BOB);
    do_depositAndBorrow(unsafeAmount, borrowAmount, vault, CHARLIE);

    // Simulate 25% price drop
    // enough for user to be liquidated
    // liquidation is still profitable
    uint256 liquidationPrice = (currentPrice * 75) / 100;
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

    mock_getPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_getPriceOf(debtAsset, collateralAsset, liquidationPrice);

    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, 3 * borrowAmount);
    uint256 collectedAmount = unsafeAmount * 3
      - _utils_getAmountInSwap(collateralAsset, debtAsset, 3 * borrowAmount + flashloanFee);

    //liquidate
    address[] memory users = new address[](3);
    users[0] = ALICE;
    users[1] = BOB;
    users[2] = CHARLIE;
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, borrowAmount * 3 + 9, flasher, swapper);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    assertApproxEqAbs(vault.balanceOf(ALICE), 0, 1);
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //check balance of bob
    assertEq(IERC20(collateralAsset).balanceOf(BOB), 0);
    assertEq(IERC20(debtAsset).balanceOf(BOB), borrowAmount);
    assertApproxEqAbs(vault.balanceOf(BOB), 0, 1);
    assertEq(vault.balanceOfDebt(BOB), 0);

    //check balance of charlie
    assertEq(IERC20(collateralAsset).balanceOf(CHARLIE), 0);
    assertEq(IERC20(debtAsset).balanceOf(CHARLIE), borrowAmount);
    assertApproxEqAbs(vault.balanceOf(CHARLIE), 0, 1);
    assertEq(vault.balanceOfDebt(CHARLIE), 0);

    //check balance of treasury
    assertApproxEqAbs(IERC20(collateralAsset).balanceOf(TREASURY), collectedAmount, 5);
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
  }

  function test_unauthorizedKeeper() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    address[] memory users = new address[](1);
    users[0] = ALICE;

    vm.expectRevert(LiquidationManager.LiquidationManager__liquidate_notValidExecutor.selector);
    vm.startPrank(CHARLIE);
    liquidationManager.liquidate(users, vault, 1000e18, flasher, swapper);
    vm.stopPrank();
  }

  function test_unauthorizedFlasher() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    address[] memory users = new address[](1);
    users[0] = ALICE;

    IFlasher invalidFlasher = IFlasher(address(0x0));
    vm.expectRevert(LiquidationManager.LiquidationManager__liquidate_notValidFlasher.selector);
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, 1000e18, invalidFlasher, swapper);
    vm.stopPrank();
  }

  function test_unauthorizedSwapper() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e18;

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    address[] memory users = new address[](1);
    users[0] = ALICE;

    ISwapper invalidSwapper = ISwapper(address(0x0));
    vm.expectRevert(LiquidationManager.LiquidationManager__liquidate_notValidSwapper.selector);
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, 1000e18, flasher, invalidSwapper);
    vm.stopPrank();
  }

  //liquidate several users with the same hf
  function test_liquidateSeveralUsersForGasReport(uint256 numberOfUsers) public {
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    uint256 borrowAmount = oracle.getPriceOf(collateralAsset, debtAsset, 18)
      - (oracle.getPriceOf(collateralAsset, debtAsset, 18) - ((1e6 * currentPrice) / 1e18)) / 2;
    uint256 maxltv = 75 * 1e16;
    uint256 unsafeAmount = (borrowAmount * 105 * 1e36) / (currentPrice * maxltv * 100);

    vm.assume(numberOfUsers > 0 && numberOfUsers < 11);

    //users
    address[] memory users = new address[](10);

    users[0] = vm.addr(user1_pk);
    users[1] = vm.addr(user2_pk);
    users[2] = vm.addr(user3_pk);
    users[3] = vm.addr(user4_pk);
    users[4] = vm.addr(user5_pk);
    users[5] = vm.addr(user6_pk);
    users[6] = vm.addr(user7_pk);
    users[7] = vm.addr(user8_pk);
    users[8] = vm.addr(user9_pk);
    users[9] = vm.addr(user10_pk);

    for (uint256 i = 0; i < numberOfUsers; i++) {
      do_depositAndBorrow(unsafeAmount, borrowAmount, vault, users[i]);
    }

    // Simulate 25% price drop
    // enough for user to be liquidated
    // liquidation is still profitable
    uint256 liquidationPrice = (currentPrice * 75) / 100;
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

    mock_getPriceOf(collateralAsset, debtAsset, inversePrice);
    mock_getPriceOf(debtAsset, collateralAsset, liquidationPrice);

    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, numberOfUsers * borrowAmount);
    uint256 collectedAmount = unsafeAmount * numberOfUsers
      - _utils_getAmountInSwap(
        collateralAsset, debtAsset, numberOfUsers * borrowAmount + flashloanFee
      );

    //liquidate
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(
      users, vault, borrowAmount * numberOfUsers + (numberOfUsers * 3), flasher, swapper
    );
    vm.stopPrank();

    for (uint256 i = 0; i < numberOfUsers; i++) {
      //check balance of user
      assertEq(IERC20(collateralAsset).balanceOf(users[i]), 0);
      assertEq(IERC20(debtAsset).balanceOf(users[i]), borrowAmount);
      assertApproxEqAbs(vault.balanceOf(users[i]), 0, 1);
      assertEq(vault.balanceOfDebt(users[i]), 0);
    }

    //check balance of treasury
    assertApproxEqAbs(
      IERC20(collateralAsset).balanceOf(TREASURY), collectedAmount, numberOfUsers * 2
    );
    assertEq(IERC20(debtAsset).balanceOf(TREASURY), 0);
  }

  function test_partialLiquidationLess18Decimals() public {
    //
    /**
     * @dev Deploy new vault with asset having less than 18 decimals
     * NOTE:
     * Need to use AaveV2 in this test because Foundry cannot persist
     * storage in AaveV3 due to complex delegate calls in within.
     * Give it a try.
     */
    ILendingProvider aave = new AaveV2Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aave;

    address collateralUSDC = registry[POLYGON_DOMAIN].usdc;
    address debtWETH = registry[POLYGON_DOMAIN].weth;

    deployVault(collateralUSDC, debtWETH, "USDC", "WETH", providers);

    // Test requires re-assigning role for some reason, DO NOT REMOVE.
    _grantRoleChief(LIQUIDATOR_ROLE, address(liquidationManager));

    uint256 currentPrice =
      oracle.getPriceOf(collateralUSDC, debtWETH, IERC20Metadata(collateralUSDC).decimals());

    uint256 borrowAmount = 1 * 10 ** IERC20Metadata(debtWETH).decimals(); // 1 WETH
    uint256 amount =
      (borrowAmount * currentPrice * 135) / (100 * 10 ** IERC20Metadata(debtWETH).decimals());

    do_depositAndBorrow(amount, borrowAmount, vault, ALICE);

    // Modify price, putting ALICE HF < 100, but above 95, so that the liquidation factor is 50%
    // 12.5% increase in WETH price will put in range.
    uint256 newPrice = (oracle.getPriceOf(collateralUSDC, debtWETH, 18) * 1125) / 1000;

    mock_getPriceOfWithDecimals(
      collateralUSDC,
      debtWETH,
      newPrice,
      IERC20Metadata(collateralUSDC).decimals(),
      IERC20Metadata(debtWETH).decimals()
    );

    //  Ensure HF is between 95 and 100
    assertApproxEqAbs(vault.getHealthFactor(ALICE), 975e15, 2.5e16);

    uint256 amountToRepayFlashloan = (borrowAmount * 0.5e18) / 1e18
      + flasher.computeFlashloanFee(debtWETH, borrowAmount * 0.5e18 / 1e18);
    //amount of collateral to swap to repay flashloan
    uint256 amountInTotal = _utils_getAmountInSwap(collateralUSDC, debtWETH, amountToRepayFlashloan);

    uint256 gainedShares = estimate_gainedShares(BorrowingVault(payable(address(vault))), ALICE);

    // Liquidate ALICE
    address[] memory users = new address[](1);
    users[0] = ALICE;

    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, (borrowAmount * 0.5e18) / 1e18, flasher, swapper);
    vm.stopPrank();

    // check balance of user
    assertEq(vault.balanceOf(ALICE), amount - gainedShares);
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), (borrowAmount * 0.5e18) / 1e18, 1);

    // //check balance of treasury
    assertEq(IERC20(collateralUSDC).balanceOf(TREASURY), gainedShares - amountInTotal);
    assertEq(IERC20(debtWETH).balanceOf(TREASURY), 0);
  }
}
