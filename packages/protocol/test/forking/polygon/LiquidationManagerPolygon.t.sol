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

contract LiquidationManagerPolygonForkingTest is ForkingSetup, Routines {
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

  LiquidationManager public liquidationManager;
  ISwapper public swapper;

  uint8 public constant DEBT_DECIMALS = 18;
  uint8 public constant ASSET_DECIMALS = 18;
  uint256 public constant LIQUIDATION_RATIO = 80 * 1e16;

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

    liquidationManager = new LiquidationManager(address(chief), TREASURY, address(swapper));
    _grantRoleChief(LIQUIDATOR_ROLE, address(liquidationManager));

    bytes memory executionCall =
      abi.encodeWithSelector(liquidationManager.allowExecutor.selector, KEEPER, true);
    _callWithTimelock(address(liquidationManager), executionCall);

    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);
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
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;

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
    liquidationManager.liquidate(users, vault, flasher, borrowAmount + 3);
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

    uint256 flashloanFee = flasher.computeFlashloanFee(debtAsset, borrowAmount * 0.5e18 / 1e18);
    uint256 amountToRepayFlashloan = (borrowAmount * 0.5e18) / 1e18 + flashloanFee;
    //amount of collateral to swap to repay flashloan
    uint256 amountInTotal =
      _utils_getAmountInSwap(collateralAsset, debtAsset, amountToRepayFlashloan);

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

    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, flasher, borrowAmount * 0.5e18 / 1e18);
    vm.stopPrank();

    //check balance of alice
    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 0);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);

    uint256 discountedPrice = (newPrice * 0.9e18) / 1e18;
    uint256 amountGivenToLiquidator = (borrowAmount * 0.5e18) / discountedPrice;

    if (amountGivenToLiquidator >= amount) {
      amountGivenToLiquidator = amount;
    }

    assertApproxEqAbs(vault.balanceOf(ALICE), amount - amountGivenToLiquidator, 1);
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), borrowAmount / 2, 1);

    //check balance of treasury
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), amountGivenToLiquidator - amountInTotal);
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
    vm.startPrank(KEEPER);
    liquidationManager.liquidate(users, vault, flasher, 0);
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
    liquidationManager.liquidate(users, vault, flasher, borrowAmount + 1);
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
    liquidationManager.liquidate(users, vault, flasher, borrowAmount * 3 + 9);
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
    liquidationManager.liquidate(users, vault, flasher, 1000e18);
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
    liquidationManager.liquidate(users, vault, invalidFlasher, 1000e18);
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
      users, vault, flasher, borrowAmount * numberOfUsers + (numberOfUsers * 3)
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
}
