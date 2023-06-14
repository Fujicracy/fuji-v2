// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {AaveV3Optimism} from "../src/providers/optimism/AaveV3Optimism.sol";
import {DForceOptimism} from "../src/providers/optimism/DForceOptimism.sol";
import {WePiggyOptimism} from "../src/providers/optimism/WePiggyOptimism.sol";

contract RunOptimism is ScriptPlus {
  AaveV3Optimism aaveV3;
  DForceOptimism dforce;
  WePiggyOptimism wePiggy;

  function setUp() public {
    setUpOn("optimism");
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
    aaveV3 = AaveV3Optimism(getAddress("Aave_V3_Optimism"));
    /*aaveV3 = new AaveV3Optimism();*/
    /*saveAddress("Aave_V3_Optimism", address(aaveV3));*/

    dforce = DForceOptimism(getAddress("DForce_Optimism"));
    /*dforce = new DForceOptimism();*/
    /*saveAddress("DForce_Optimism", address(dforce));*/

    wePiggy = WePiggyOptimism(getAddress("We_Piggy_Optimism"));
    /*wePiggy = new WePiggyOptimism();*/
    /*saveAddress("We_Piggy_Optimism", address(wePiggy));*/
  }

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](3);
    providers[0] = aaveV3;
    providers[1] = wePiggy;
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
