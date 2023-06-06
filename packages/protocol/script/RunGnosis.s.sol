// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {AgaveGnosis} from "../src/providers/gnosis/AgaveGnosis.sol";

contract RunGnosis is ScriptPlus {
  AgaveGnosis agave;

  function setUp() public {
    setUpOn("gnosis");
  }

  function run() public {
    vm.startBroadcast(deployer);

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    /*setOrDeployAddrMapper(false);*/

    agave = AgaveGnosis(getAddress("AgaveGnosis"));
    /*agave = new AgaveGnosis();*/
    /*saveAddress("AgaveGnosis", address(agave));*/

    /*_deployVault("WETH", "USDC", "BorrowingVault-WETHUSDC-1", 90);*/

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 55);*/

    // If setting all routers at once, call after deploying all chians
    /*setRouters();*/

    vm.stopBroadcast();
  }

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = agave;
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
    uint256 maxLtv = 750000000000000000;
    uint256 liqRatio = 800000000000000000;

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = agave;
    address vault = chief.deployVault(
      address(factory),
      abi.encode(collateral, debt, address(oracle), providers, maxLtv, liqRatio),
      rating
    );
    saveAddress(name, vault);
  }
}
