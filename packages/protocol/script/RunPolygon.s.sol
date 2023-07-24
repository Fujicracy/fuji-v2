// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {AaveV3Polygon} from "../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../src/providers/polygon/AaveV2Polygon.sol";
import {DForcePolygon} from "../src/providers/polygon/DForcePolygon.sol";
import {CompoundV3Polygon} from "../src/providers/polygon/CompoundV3Polygon.sol";

contract RunPolygon is ScriptPlus {
  AaveV3Polygon aaveV3;
  AaveV2Polygon aaveV2;
  DForcePolygon dforce;
  CompoundV3Polygon compound;

  function setUp() public {
    setUpOn();
  }

  function run() public {
    vm.startBroadcast(deployer);

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    setOrDeployYieldVaultFactory(false);
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

    // If setting all routers at once, call after deploying all chains
    /*setConnextReceivers();*/

    /*upgradeBorrowingImpl(false);*/

    vm.stopBroadcast();
  }

  function _setLendingProviders() internal {
    aaveV3 = AaveV3Polygon(getAddress("Aave_V3_Polygon"));
    /*aaveV3 = new AaveV3Polygon();*/
    /*saveAddress("Aave_V3_Polygon", address(aaveV3));*/

    aaveV2 = AaveV2Polygon(getAddress("Aave_V2_Polygon"));
    /*aaveV2 = new AaveV2Polygon();*/
    /*saveAddress("Aave_V2_Polygon", address(aaveV2));*/

    dforce = DForcePolygon(getAddress("DForce_Polygon"));
    /*dforce = new DForcePolygon();*/
    /*saveAddress("DForce_Polygon", address(dforce));*/

    compound = CompoundV3Polygon(getAddress("Compound_V3_Polygon"));
    /*compound = new CompoundV3Polygon();*/
    /*saveAddress("Compound_V3_Polygon", address(compound));*/
  }
}
