// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.s.sol";
import {AaveV3Arbitrum} from "../src/providers/arbitrum/AaveV3Arbitrum.sol";
import {RadiantArbitrum} from "../src/providers/arbitrum/RadiantArbitrum.sol";
import {DForceArbitrum} from "../src/providers/arbitrum/DForceArbitrum.sol";
import {CompoundV3Arbitrum} from "../src/providers/arbitrum/CompoundV3Arbitrum.sol";

contract RunArbitrum is ScriptPlus {
  AaveV3Arbitrum aaveV3;
  RadiantArbitrum radiant;
  DForceArbitrum dforce;
  CompoundV3Arbitrum compound;

  function setUp() public {
    setUpOn();
  }

  function run() public {
    vm.startBroadcast(deployer);

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    setOrDeployYieldVaultFactory(false, false);
    setOrDeployAddrMapper(false);
    setOrDeployFlasherBalancer(false);
    setOrDeployRebalancer(false);

    _setLendingProviders();

    if (chief.allowedVaultFactory(address(factory))) {
      deployBorrowingVaults();
      /*setBorrowingVaults();*/
    }

    if (chief.allowedVaultFactory(address(yieldFactory))) {
      deployYieldVaults();
    }

    /*setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/
    /*rebalanceVault("BorrowingVault-WETHUSDC", compound, aaveV3);*/
    /*rebalanceYieldVaults();*/
    /*rebalanceBorrowingVaults();*/

    // If setting all routers at once, call after deploying all chians
    /*setConnextReceivers();*/

    /*upgradeBorrowingImpl(false);*/

    vm.stopBroadcast();
  }

  function _setLendingProviders() internal {
    aaveV3 = AaveV3Arbitrum(getAddress("Aave_V3_Arbitrum"));
    /*aaveV3 = new AaveV3Arbitrum();*/
    /*saveAddress("Aave_V3_Arbitrum", address(aaveV3));*/

    radiant = RadiantArbitrum(getAddress("Radiant_Arbitrum"));
    /*radiant = new RadiantArbitrum();*/
    /*saveAddress("Radiant_Arbitrum", address(radiant));*/

    dforce = DForceArbitrum(getAddress("DForce_Arbitrum"));
    /*dforce = new DForceArbitrum();*/
    /*saveAddress("DForce_Arbitrum", address(dforce));*/

    compound = CompoundV3Arbitrum(getAddress("Compound_V3_Arbitrum"));
    /*compound = new CompoundV3Arbitrum();*/
    /*saveAddress("Compound_V3_Arbitrum", address(compound));*/
  }
}
