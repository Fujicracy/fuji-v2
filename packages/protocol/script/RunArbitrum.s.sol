// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
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
    setUpOn("arbitrum");
  }

  function run() public {
    vm.startBroadcast(deployer);

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory2(false, false);
    setOrDeployAddrMapper(false);

    _setLendingProviders();

    if (chief.allowedVaultFactory(address(factory))) {
      deployBorrowingVaults2();
      setBorrowingVaults2();
      initBorrowingVaults2();
    }

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC-2");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/

    // If setting all routers at once, call after deploying all chians
    /*setRouters();*/

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

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](3);
    providers[0] = aaveV3;
    providers[1] = radiant;
    providers[2] = dforce;
    bytes memory callData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    callWithTimelock(address(vault), callData);
  }

  function _setVaultNewRating(string memory vaultName, uint256 rating) internal {
    bytes memory callData =
      abi.encodeWithSelector(chief.setSafetyRating.selector, getAddress(vaultName), rating);
    callWithTimelock(address(chief), callData);
  }
}
