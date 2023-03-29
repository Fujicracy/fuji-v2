// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVaultFactory} from "../src/vaults/borrowing/BorrowingVaultFactory.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextVanillaRouter} from "../src/routers/ConnextVanillaRouter.sol";
import {IWETH9} from "../src/abstracts/WETH9.sol";
import {AgaveGnosis} from "../src/providers/gnosis/AgaveGnosis.sol";
import {HundredGnosis} from "../src/providers/gnosis/HundredGnosis.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployGnosis is ScriptPlus {
  Chief chief;
  BorrowingVaultFactory factory;
  TimelockController timelock;
  FujiOracle oracle;
  ConnextVanillaRouter connextRouter;

  AgaveGnosis agaveGnosis;
  HundredGnosis hundredGnosis;

  IConnext connext = IConnext(0x5bB83e95f63217CDa6aE3D181BA580Ef377D2109);
  IWETH9 WETH = IWETH9(0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1);
  ERC20 DAI;
  ERC20 USDC = ERC20(0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83);
  ERC20 USDT;

  function setUp() public {
    chainName = "gnosis";
  }

  function run() public {
    vm.startBroadcast();

    agaveGnosis = AgaveGnosis(getAddress("AgaveGnosis"));
    /*agaveGnosis = new AgaveGnosis();*/
    /*saveAddress("AgaveGnosis", address(agaveGnosis));*/

    hundredGnosis = HundredGnosis(getAddress("HundredGnosis"));
    /*hundredGnosis = new HundredGnosis();*/
    /*saveAddress("HundredGnosis", address(hundredGnosis));*/

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief(true, false);*/
    /*saveAddress("Chief", address(chief));*/

    timelock = TimelockController(payable(chief.timelock()));

    oracle = FujiOracle(getAddress("FujiOracle"));
    /*address[] memory assets = new address[](2);*/
    /*assets[0] = address(WETH);*/
    /*assets[1] = address(USDC);*/
    /*address[] memory feeds = new address[](2);*/
    /*feeds[0] = 0xa767f745331D267c7751297D982b050c93985627;*/
    /*feeds[1] = 0x26C31ac71010aF62E6B486D1132E266D6298857D;*/
    /*oracle = new FujiOracle(assets, feeds, address(chief));*/
    /*saveAddress("FujiOracle", address(oracle));*/

    connextRouter = ConnextVanillaRouter(payable(getAddress("ConnextVanillaRouter")));
    /*connextRouter = new ConnextVanillaRouter(WETH, connext, chief);*/
    /*saveAddress("ConnextVanillaRouter", address(connextRouter));*/

    factory = BorrowingVaultFactory(getAddress("BorrowingVaultFactory"));
    /*factory = new BorrowingVaultFactory(address(chief));*/
    /*saveAddress("BorrowingVaultFactory", address(factory));*/

    /*_scheduleWithTimelock(*/
    /*address(factory),*/
    /*abi.encodeWithSelector(*/
    /*factory.setContractCode.selector, vm.getCode("BorrowingVault.sol:BorrowingVault")*/
    /*)*/
    /*);*/
    /*_scheduleWithTimelock(*/
    /*address(chief),*/
    /*abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(factory),*/
    /*abi.encodeWithSelector(*/
    /*factory.setContractCode.selector, vm.getCode("BorrowingVault.sol:BorrowingVault")*/
    /*)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(chief),*/
    /*abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true)*/
    /*);*/

    /*_deployVault(address(WETH), address(DAI), "BorrowingVault-WETHDAI");*/
    /*_deployVault(address(WETH), address(USDC), "BorrowingVault-WETHUSDC");*/
    /*_deployVault(address(WETH), address(USDT), "BorrowingVault-WETHUSDT");*/

    /*address polygonRouter = getAddressAt("ConnextVanillaRouter", "polygon");*/
    /*address optimismRouter = getAddressAt("ConnextVanillaRouter", "optimism");*/
    /*address arbitrumRouter = getAddressAt("ConnextVanillaRouter", "arbitrum");*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, POLYGON_DOMAIN, polygonRouter)*/
    /*);*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, OPTIMISM_DOMAIN, optimismRouter)*/
    /*);*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/

    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, POLYGON_DOMAIN, polygonRouter)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, OPTIMISM_DOMAIN, optimismRouter)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC");*/

    vm.stopBroadcast();
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = agaveGnosis;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debtAsset, address(oracle), providers), 95
    );
    saveAddress(name, vault);
  }

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = agaveGnosis;
    providers[1] = hundredGnosis;
    bytes memory callData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    _scheduleWithTimelock(address(vault), callData);
    /*_executeWithTimelock(address(vault), callData);*/
  }

  function _scheduleWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1 seconds);
  }

  function _executeWithTimelock(address target, bytes memory callData) internal {
    timelock.execute(target, 0, callData, 0x00, 0x00);
  }
}
