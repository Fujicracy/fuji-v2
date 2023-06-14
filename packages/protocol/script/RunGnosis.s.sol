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
    setOrDeployBorrowingVaultFactory2(false, false);
    /*setOrDeployAddrMapper(false);*/

    agave = AgaveGnosis(getAddress("Agave_Gnosis"));
    /*agave = new AgaveGnosis();*/
    /*saveAddress("Agave_Gnosis", address(agave));*/

    if (chief.allowedVaultFactory(address(factory))) {
      deployBorrowingVaults2();
      setBorrowingVaults2();
      initBorrowingVaults2();
    }

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
}
