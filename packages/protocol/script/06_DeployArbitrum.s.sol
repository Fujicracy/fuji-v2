// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVaultFactory} from "../src/vaults/borrowing/BorrowingVaultFactory.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {IWETH9} from "../src/abstracts/WETH9.sol";
import {AaveV3Arbitrum} from "../src/providers/arbitrum/AaveV3Arbitrum.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployArbitrum is ScriptPlus {
  Chief chief;
  BorrowingVaultFactory factory;
  TimelockController timelock;
  FujiOracle oracle;
  ConnextRouter connextRouter;

  AaveV3Arbitrum aaveV3Arbitrum;

  IConnext connextHandler = IConnext(0xEE9deC2712cCE65174B561151701Bf54b99C24C8);
  IWETH9 WETH = IWETH9(0x82aF49447D8a07e3bd95BD0d56f35241523fBab1);
  ERC20 DAI;
  ERC20 USDC = ERC20(0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8);
  ERC20 USDT;

  function setUp() public {
    chainName = "arbitrum";
  }

  function run() public {
    vm.startBroadcast();

    aaveV3Arbitrum = AaveV3Arbitrum(getAddress("AaveV3Arbitrum"));
    /*aaveV3Arbitrum = new AaveV3Arbitrum();*/
    /*saveAddress("AaveV3Arbitrum", address(aaveV3Arbitrum));*/

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief(true, false);*/
    /*saveAddress("Chief", address(chief));*/

    timelock = TimelockController(payable(chief.timelock()));

    oracle = FujiOracle(getAddress("FujiOracle"));
    /*address[] memory assets = new address[](2);*/
    /*assets[0] = address(WETH);*/
    /*assets[1] = address(USDC);*/
    /*address[] memory feeds = new address[](2);*/
    /*feeds[0] = 0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612;*/
    /*feeds[1] = 0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3;*/
    /*oracle = new FujiOracle(assets, feeds, address(chief));*/
    /*saveAddress("FujiOracle", address(oracle));*/

    connextRouter = ConnextRouter(payable(getAddress("ConnextRouter")));
    /*connextRouter = new ConnextRouter(WETH, connextHandler, chief);*/
    /*saveAddress("ConnextRouter", address(connextRouter));*/

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

    /*address polygonRouter = getAddressAt("ConnextRouter", "polygon");*/
    /*address optimismRouter = getAddressAt("ConnextRouter", "optimism");*/
    /*address gnosisRouter = getAddressAt("ConnextRouter", "gnosis");*/
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
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)*/
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
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)*/
    /*);*/

    vm.stopBroadcast();
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3Arbitrum;
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
