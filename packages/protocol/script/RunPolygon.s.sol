// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
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
    setUpOn("polygon");
  }

  function run() public {
    vm.startBroadcast(deployer);

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    setOrDeployAddrMapper(false);

    _setLendingProviders();

    if (chief.allowedVaultFactory(address(factory))) {
      deployBorrowingVaults2();
      setBorrowingVaults2();
    }

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC-2");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/

    // If setting all routers at once, call after deploying all chians
    /*setRouters();*/

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

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](3);
    providers[0] = aaveV2;
    providers[1] = aaveV3;
    providers[2] = compound;
    bytes memory callData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    callWithTimelock(address(vault), callData);
  }

  function _setVaultNewRating(string memory vaultName, uint256 rating) internal {
    bytes memory callData =
      abi.encodeWithSelector(chief.setSafetyRating.selector, getAddress(vaultName), rating);
    callWithTimelock(address(chief), callData);
  }
}
