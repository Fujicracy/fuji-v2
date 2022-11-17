// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../../forking/ForkingSetup.sol";
import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";

// This is a test template meant to be used in a forked environement.
// Copy it to the dedicated chain directory and customize it.

// "ForkingSetup"
// Get some basic properties and contracts deployed and initialized or some utility functions:
// - collateralAsset - WETH
// - debtAsset - USDC
// - vault - a borrowing vault
// - (for a complete list check the contract)
// By inheriting from "ForkingSetup", all those are available in your test.
// It also takes care of the fork creation and selection.

contract SimpleRouterTest is Routines, ForkingSetup {
  ILendingProvider public aaveV2;
  ILendingProvider public aaveV3;

  BorrowingVault public vault2;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  address public debtAsset2;

  function setUp() public {
    deploy(POLYGON_DOMAIN);

    aaveV3 = new AaveV3Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(aaveV3);

    // new BorrowingVault with DAI as debtAsset

    debtAsset2 = registry[POLYGON_DOMAIN].dai;
    mockOracle.setUSDPriceOf(debtAsset2, 100000000);

    vault2 = new BorrowingVault(
      collateralAsset,
      debtAsset2,
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH-USDC Vault Shares",
      "fv2WETHUSDC"
    );

    aaveV2 = new AaveV2Polygon();
    providers[0] = aaveV2;

    _setVaultProviders(vault2, providers);
    vault2.setActiveProvider(aaveV2);
  }
}
