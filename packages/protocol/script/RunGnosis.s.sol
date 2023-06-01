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

    agave = AgaveGnosis(getAddress("AgaveGnosis"));
    /*agave = new AgaveGnosis();*/
    /*saveAddress("AgaveGnosis", address(agave));*/

    string[] memory assets = new string[](4);
    assets[0] = "WETH";
    assets[1] = "USDC";
    assets[2] = "DAI";
    assets[3] = "USDT";
    setOrDeployFujiOracle(false, assets);

    setOrDeployBorrowingVaultFactory(false);

    /*_configBorrowingVaultFactory();*/

    /*_deployVault("WETH", "DAI", "BorrowingVault-WETHDAI", 90);*/

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 55);*/

    vm.stopBroadcast();
  }

  function _setRouters() internal {
    address polygonRouter = getAddressAt("ConnextRouter", "polygon");
    address optimismRouter = getAddressAt("ConnextRouter", "optimism");
    address arbitrumRouter = getAddressAt("ConnextRouter", "arbitrum");

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
      abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)
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
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/
  }

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = agave;
    bytes memory callData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    /*scheduleWithTimelock(address(vault), callData);*/
    executeWithTimelock(address(vault), callData);
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

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = agave;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debt, address(oracle), providers), rating
    );
    saveAddress(name, vault);
  }
}
