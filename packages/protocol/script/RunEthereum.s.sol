// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.s.sol";
import {AaveV2} from "../src/providers/mainnet/AaveV2.sol";
import {AaveV3} from "../src/providers/mainnet/AaveV3.sol";
import {CompoundV2} from "../src/providers/mainnet/CompoundV2.sol";
import {CompoundV3} from "../src/providers/mainnet/CompoundV3.sol";
import {MorphoAaveV2} from "../src/providers/mainnet/MorphoAaveV2.sol";
import {MorphoCompound} from "../src/providers/mainnet/MorphoCompound.sol";
import {DForce} from "../src/providers/mainnet/DForce.sol";

contract RunEthereum is ScriptPlus {
  AaveV2 aaveV2;
  AaveV3 aaveV3;
  CompoundV2 compoundV2;
  CompoundV3 compoundV3;
  DForce dforce;
  MorphoAaveV2 morphoAaveV2;
  MorphoCompound morphoCompound;

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
    /*setOrDeployFlasherBalancer(false);*/
    /*setOrDeployRebalancer(false);*/

    _setLendingProviders();

    if (chief.allowedVaultFactory(address(factory))) {
      deployBorrowingVaults();
      setBorrowingVaults();
    }

    /*setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/
    /*rebalanceVault("BorrowingVault-WETHUSDC", compound, aaveV3);*/

    // If setting all routers at once, call after deploying all chians
    /*setConnextReceivers();*/

    /*upgradeBorrowingImpl(false);*/

    /*bytes memory constructorArgs = abi.encode(getAddress("ConnextRouter"));*/
    /*verifyContract("ConnextHandler", constructorArgs);*/

    vm.stopBroadcast();
  }

  function _setLendingProviders() internal {
    aaveV2 = AaveV2(getAddress("Aave_V2"));
    /*aaveV2 = new AaveV2();*/
    /*saveAddress("Aave_V2", address(aaveV2));*/

    aaveV3 = AaveV3(getAddress("Aave_V3"));
    /*aaveV3 = new AaveV3();*/
    /*saveAddress("Aave_V3", address(aaveV3));*/

    dforce = DForce(getAddress("DForce"));
    /*dforce = new DForce();*/
    /*saveAddress("DForce", address(dforce));*/

    compoundV2 = CompoundV2(getAddress("Compound_V2"));
    /*compoundV2 = new CompoundV2();*/
    /*saveAddress("Compound_V2", address(compoundV2));*/

    compoundV3 = CompoundV3(getAddress("Compound_V3"));
    /*compoundV3 = new CompoundV3();*/
    /*saveAddress("Compound_V3", address(compoundV3));*/

    morphoAaveV2 = MorphoAaveV2(getAddress("Morpho_Aave_V2"));
    /*morphoAaveV2 = new MorphoAaveV2();*/
    /*saveAddress("Morpho_Aave_V2", address(morphoAaveV2));*/

    morphoCompound = MorphoCompound(getAddress("Morpho_Compound"));
    /*morphoCompound = new MorphoCompound();*/
    /*saveAddress("Morpho_Compound", address(morphoCompound));*/
  }
}
