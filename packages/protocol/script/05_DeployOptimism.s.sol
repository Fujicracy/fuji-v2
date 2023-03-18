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
import {AaveV3Optimism} from "../src/providers/optimism/AaveV3Optimism.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployOptimism is ScriptPlus {
  Chief chief;
  BorrowingVaultFactory factory;
  TimelockController timelock;
  FujiOracle oracle;
  ConnextVanillaRouter connextRouter;

  AaveV3Optimism aaveV3Optimism;

  IConnext connext = IConnext(0x8f7492DE823025b4CfaAB1D34c58963F2af5DEDA);
  IWETH9 WETH = IWETH9(0x4200000000000000000000000000000000000006);
  ERC20 DAI = ERC20(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);
  ERC20 USDC = ERC20(0x7F5c764cBc14f9669B88837ca1490cCa17c31607);
  ERC20 USDT = ERC20(0x94b008aA00579c1307B0EF2c499aD98a8ce58e58);

  function setUp() public {
    chainName = "optimism";
  }

  function run() public {
    vm.startBroadcast();

    aaveV3Optimism = AaveV3Optimism(getAddress("AaveV3Optimism"));
    /*aaveV3Optimism = new AaveV3Optimism();*/
    /*saveAddress("AaveV3Optimism", address(aaveV3Optimism));*/

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief(true, false);*/
    /*saveAddress("Chief", address(chief));*/

    timelock = TimelockController(payable(chief.timelock()));

    oracle = FujiOracle(getAddress("FujiOracle"));
    /*_setNewPriceFeed(address(DAI), 0x8dBa75e83DA73cc766A7e5a0ee71F656BAb470d6);*/
    /*address[] memory assets = new address[](2);*/
    /*assets[0] = address(WETH);*/
    /*assets[1] = address(USDC);*/
    /*address[] memory feeds = new address[](2);*/
    /*feeds[0] = 0x13e3Ee699D1909E989722E753853AE30b17e08c5;*/
    /*feeds[1] = 0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3;*/
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
    /*_executeWithTimelock(*/
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
    /*address(chief),*/
    /*abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true)*/
    /*);*/

    /*_deployVault(address(WETH), address(DAI), "BorrowingVault-WETHDAI");*/
    /*_deployVault(address(WETH), address(USDC), "BorrowingVault-WETHUSDC");*/
    /*_deployVault(address(WETH), address(USDT), "BorrowingVault-WETHUSDT");*/

    /*address polygonRouter = getAddressAt("ConnextVanillaRouter", "polygon");*/
    /*address arbitrumRouter = getAddressAt("ConnextVanillaRouter", "arbitrum");*/
    /*address gnosisRouter = getAddressAt("ConnextVanillaRouter", "gnosis");*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, POLYGON_DOMAIN, polygonRouter)*/
    /*);*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)*/
    /*);*/

    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, POLYGON_DOMAIN, polygonRouter)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)*/
    /*);*/

    vm.stopBroadcast();
  }

  function _setNewPriceFeed(address asset, address feed) internal {
    _scheduleWithTimelock(
      address(oracle), abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed)
    );

    _executeWithTimelock(
      address(oracle), abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed)
    );
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3Optimism;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debtAsset, address(oracle), providers), 95
    );
    saveAddress(name, vault);
  }

  function _scheduleWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1 seconds);
  }

  function _executeWithTimelock(address target, bytes memory callData) internal {
    timelock.execute(target, 0, callData, 0x00, 0x00);
  }
}
