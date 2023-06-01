// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {AaveV3Arbitrum} from "../src/providers/arbitrum/AaveV3Arbitrum.sol";
import {RadiantArbitrum} from "../src/providers/arbitrum/RadiantArbitrum.sol";
import {DForceArbitrum} from "../src/providers/arbitrum/DForceArbitrum.sol";
import {FujiOracle} from "../src/FujiOracle.sol";

contract RunArbitrum is ScriptPlus {
  AaveV3Arbitrum aaveV3;
  RadiantArbitrum radiant;
  DForceArbitrum dforce;

  function setUp() public {
    setUpOn("arbitrum");
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
    aaveV3 = AaveV3Arbitrum(getAddress("AaveV3Arbitrum"));
    /*aaveV3 = new AaveV3Arbitrum();*/
    /*saveAddress("AaveV3Arbitrum", address(aaveV3));*/

    radiant = RadiantArbitrum(getAddress("RadiantArbitrum"));
    /*radiant = new RadiantArbitrum();*/
    /*saveAddress("RadiantArbitrum", address(radiant));*/

    dforce = DForceArbitrum(getAddress("DForceArbitrum"));
    /*dforce = new DForceArbitrum();*/
    /*saveAddress("DForceArbitrum", address(dforce));*/
  }

  function _setRouters() internal {
    address polygonRouter = getAddressAt("ConnextRouter", "polygon");
    address optimismRouter = getAddressAt("ConnextRouter", "optimism");
    address gnosisRouter = getAddressAt("ConnextRouter", "gnosis");

    scheduleWithTimelock(
      address(connextRouter),
      abi.encodeWithSelector(connextRouter.setRouter.selector, POLYGON_DOMAIN, polygonRouter)
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
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, POLYGON_DOMAIN, polygonRouter)*/
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

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](3);
    providers[0] = aaveV3;
    providers[1] = radiant;
    providers[2] = dforce;
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
    providers[0] = aaveV3;
    providers[1] = radiant;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debt, address(oracle), providers), rating
    );
    saveAddress(name, vault);
  }
}
