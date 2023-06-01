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

    _setLendingProviders();

    string[] memory assets = new string[](4);
    assets[0] = "WETH";
    assets[1] = "USDC";
    assets[2] = "DAI";
    assets[3] = "USDT";
    setOrDeployFujiOracle(false, assets);

    setOrDeployBorrowingVaultFactory(false);

    /*_configBorrowingVaultFactory();*/

    /*_deployVault("WETH", "DAI", "BorrowingVault-WETHDAI", 90);*/

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC-2");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/

    vm.stopBroadcast();
  }

  function _setLendingProviders() internal {
    aaveV3 = AaveV3Polygon(getAddress("AaveV3Polygon"));
    /*aaveV3 = new AaveV3Polygon();*/
    /*saveAddress("AaveV3Polygon", address(aaveV3));*/

    aaveV2 = AaveV2Polygon(getAddress("AaveV2Polygon"));
    /*aaveV2 = new AaveV2Polygon();*/
    /*saveAddress("AaveV2Polygon", address(aaveV2));*/

    dforce = DForcePolygon(getAddress("DForcePolygon"));
    /*dforce = new DForcePolygon();*/
    /*saveAddress("DForcePolygon", address(dforce));*/

    compound = CompoundV3Polygon(getAddress("CompoundV3Polygon"));
    /*compound = new CompoundV3Polygon();*/
    /*saveAddress("CompoundV3Polygon", address(compound));*/
  }

  function _setRouters() internal {
    address arbitrumRouter = getAddressAt("ConnextRouter", "arbitrum");
    address optimismRouter = getAddressAt("ConnextRouter", "optimism");
    address gnosisRouter = getAddressAt("ConnextRouter", "gnosis");

    scheduleWithTimelock(
      address(connextRouter),
      abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)
    );
    scheduleWithTimelock(
      address(connextRouter),
      abi.encodeWithSelector(connextRouter.setRouter.selector, OPTIMISM_DOMAIN, optimismRouter)
    );
    scheduleWithTimelock(
      address(connextRouter),
      abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)
    );

    /*executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/
    /*executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, OPTIMISM_DOMAIN, optimismRouter)*/
    /*);*/
    /*executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)*/
    /*);*/
  }

  function _setNewPriceFeed(address asset, address feed) internal {
    scheduleWithTimelock(
      address(oracle), abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed)
    );

    /*executeWithTimelock(*/
    /*address(oracle), abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed)*/
    /*);*/
  }

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](3);
    providers[0] = aaveV2;
    providers[1] = aaveV3;
    providers[2] = compound;
    bytes memory callData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    scheduleWithTimelock(address(vault), callData);
    /*executeWithTimelock(address(vault), callData);*/
  }

  function _setVaultNewRating(string memory vaultName, uint256 rating) internal {
    bytes memory callData =
      abi.encodeWithSelector(chief.setSafetyRating.selector, getAddress(vaultName), rating);
    scheduleWithTimelock(address(chief), callData);
    /*executeWithTimelock(address(chief), callData);*/
  }

  function _configBorrowingVaultFactory() internal {
    scheduleWithTimelock(
      address(factory),
      abi.encodeWithSelector(
        factory.setContractCode.selector, vm.getCode("BorrowingVault.sol:BorrowingVault")
      )
    );
    scheduleWithTimelock(
      address(chief),
      abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true)
    );
    /*executeWithTimelock(*/
    /*address(factory),*/
    /*abi.encodeWithSelector(*/
    /*factory.setContractCode.selector, vm.getCode("BorrowingVault.sol:BorrowingVault")*/
    /*)*/
    /*);*/
    /*executeWithTimelock(*/
    /*address(chief),*/
    /*abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true)*/
    /*);*/
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
    providers[0] = aaveV2;
    providers[1] = aaveV3;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debt, address(oracle), providers), rating
    );
    saveAddress(name, vault);
  }
}
