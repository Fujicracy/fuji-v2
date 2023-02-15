// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {BaseVault} from "../../../src/abstracts/BaseVault.sol";
import {MockERC20Decimals} from "../../../src/mocks/MockERC20Decimals.sol";
import {Chief} from "../../../src/Chief.sol";
import {MockProvider} from "../../../src/mocks/MockProvider.sol";

contract VaultUnitTests is MockingSetup, MockRoutines {
  event MinAmountChanged(uint256 newMinAmount);
  event DepositCapChanged(uint256 newDepositCap);

  uint8 public constant DEBT_DECIMALS = 18;
  uint8 public constant ASSET_DECIMALS = 6;
  uint256 public constant LIQUIDATION_RATIO = 80 * 1e16;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");

    

    MockERC20Decimals tUSDC = new MockERC20Decimals("Test USDC", "tUSDC", 6);
    collateralAsset = address(tUSDC);
    vm.label(collateralAsset, "testUSDC");

    MockERC20Decimals tWETH = new MockERC20Decimals("Test WETH", "tWETH", 18);
    debtAsset = address(tWETH);
    vm.label(debtAsset, "testWETH");

    oracle = new MockOracle();
    //example WETH and USDC prices: 15000 USDC/WETH
    oracle.setUSDPriceOf(collateralAsset, 1e8);  ///USDC price = 1$
    oracle.setUSDPriceOf(debtAsset, 1500e8);  //WETH price = 150$ 

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));

    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));
    _grantRoleChief(HOUSE_KEEPER_ROLE, address(this));

    // Initialize with a default mockProvider
    mockProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    vault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(oracle),
      address(chief),
      "Fuji-V2 tWETH-tDAI BorrowingVault",
      "fbvtWETHtDAI",
      providers
    );
  }


  function setUp() public {
    _grantRoleChief(LIQUIDATOR_ROLE, BOB);
  }

  function mock_getPriceOf(address asset1, address asset2, uint256 decimals, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, decimals),
      abi.encode(price)
    );
  }
  
  function test_liquidateIssue() public {
    uint256 borrowAmount = 1e18;  //borrow 1 WETH

    //getPriceOf(tWETH, tUSDC, 18) ~= 6.6e14
    uint256 currentPrice = oracle.getPriceOf(debtAsset, collateralAsset, 18);
    console.log("initial USDC price", currentPrice);

    uint256 maxltv = vault.maxLtv();
    uint256 depositAmount = 3000e6; //3000$

    do_depositAndBorrow(depositAmount, borrowAmount, vault, ALICE);

    // Simulate 40% price (of USDC) drop
    uint256 liquidationPrice = (currentPrice * 60) / 100; 
    uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;  

    //set getPriceOf(tUSDc, tWETH, 6) 
    mock_getPriceOf(collateralAsset, debtAsset, 6, inversePrice); //price from WETH to USDC
    //set getPriceOf(tWETH, tUSDc, 1e18)
    mock_getPriceOf(debtAsset, collateralAsset, 18, liquidationPrice);  //price from USDC to WETH

    console.log("WETH price ", oracle.getPriceOf(collateralAsset, debtAsset, 6));
    console.log("USDC price ", oracle.getPriceOf(debtAsset, collateralAsset, 18));

    //now liquidattion factor of Alice = 50%
    assertEq(vault.getLiquidationFactor(ALICE), 5e17);

    _dealMockERC20(debtAsset, BOB, borrowAmount);
    vm.startPrank(BOB);
    IERC20(debtAsset).approve(address(vault), borrowAmount);

    //can't liquidate Alice
    vm.expectRevert("Transfer more than max");
    vault.liquidate(ALICE, BOB);
    vm.stopPrank();
  }
}
 