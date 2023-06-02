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
    setOrDeployBorrowingVaultFactory(false);
    setOrDeployAddrMapper(false);

    _setLendingProviders();
    /*_deployVault("WETH", "DAI", "BorrowingVault-WETHDAI", 90);*/

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC-2");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/

    // If setting all routers at once, call after deploying all chians
    /*setRouters();*/

    vm.stopBroadcast();
  }

  function _setLendingProviders() internal {
    aaveV3 = AaveV3Optimism(getAddress("AaveV3Optimism"));
    /*aaveV3 = new AaveV3Optimism();*/
    /*saveAddress("AaveV3Optimism", address(aaveV3));*/

    dforce = DForceOptimism(getAddress("DForceOptimism"));
    /*dforce = new DForceOptimism();*/
    /*saveAddress("DForceOptimism", address(dforce));*/

    wePiggy = WePiggyOptimism(getAddress("WePiggyOptimism"));
    /*wePiggy = new WePiggyOptimism();*/
    /*saveAddress("WePiggyOptimism", address(wePiggy));*/
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

  function _deployVault(
    string memory collateralAddr,
    string memory debtAddr,
    string memory name,
    uint256 rating
  )
    internal
  {
    address collateral = readAddrFromConfig(collateralAddr);
    address debt = readAddrFromConfig(debtAddr);

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = dforce;
    providers[1] = aaveV3;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debt, address(oracle), providers), rating
    );
    saveAddress(name, vault);
  }
}
