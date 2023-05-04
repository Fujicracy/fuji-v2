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
import {AaveV3Polygon} from "../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../src/providers/polygon/AaveV2Polygon.sol";
import {DForcePolygon} from "../src/providers/polygon/DForcePolygon.sol";
import {OvixPolygon} from "../src/providers/polygon/OvixPolygon.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployPolygon is ScriptPlus {
  Chief chief;
  BorrowingVaultFactory factory;
  TimelockController timelock;
  FujiOracle oracle;
  ConnextRouter connextRouter;

  AaveV3Polygon aaveV3;
  AaveV2Polygon aaveV2;
  DForcePolygon dforce;
  OvixPolygon ovix;

  IConnext connextHandler = IConnext(0x11984dc4465481512eb5b777E44061C158CF2259);
  IWETH9 WETH = IWETH9(0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619);
  ERC20 DAI = ERC20(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063);
  ERC20 USDC = ERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
  ERC20 USDT = ERC20(0xc2132D05D31c914a87C6611C10748AEb04B58e8F);

  function setUp() public {
    chainName = "polygon";
  }

  function run() public {
    uint256 pvk = vm.envUint("DEPLOYER_PRIVATE_KEY");
    address deployer = vm.addr(pvk);

    vm.startBroadcast(deployer);

    _handleLendingProviders();

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief(true, false);*/
    /*saveAddress("Chief", address(chief));*/

    timelock = TimelockController(payable(chief.timelock()));

    oracle = FujiOracle(getAddress("FujiOracle"));
    /*_setNewPriceFeed(address(DAI), 0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D);*/
    /*address[] memory assets = new address[](2);*/
    /*assets[0] = address(WETH);*/
    /*assets[1] = address(USDC);*/
    /*address[] memory feeds = new address[](2);*/
    /*feeds[0] = 0xF9680D99D6C9589e2a93a78A04A279e509205945;*/
    /*feeds[1] = 0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7;*/
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

    /*_setVaultNewProviders("BorrowingVault-WETHUSDC");*/
    /*_setVaultNewRating("BorrowingVault-WETHUSDC", 75);*/

    vm.stopBroadcast();
  }

  function _setRouters() internal {
    /*address arbitrumRouter = getAddressAt("ConnextRouter", "arbitrum");*/
    /*address optimismRouter = getAddressAt("ConnextRouter", "optimism");*/
    /*address gnosisRouter = getAddressAt("ConnextRouter", "gnosis");*/
    /*_scheduleWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
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
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, ARBITRUM_DOMAIN, arbitrumRouter)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, OPTIMISM_DOMAIN, optimismRouter)*/
    /*);*/
    /*_executeWithTimelock(*/
    /*address(connextRouter),*/
    /*abi.encodeWithSelector(connextRouter.setRouter.selector, GNOSIS_DOMAIN, gnosisRouter)*/
    /*);*/
  }

  function _handleLendingProviders() internal {
    aaveV3 = AaveV3Polygon(getAddress("AaveV3Polygon"));
    /*aaveV3 = new AaveV3Polygon();*/
    /*saveAddress("AaveV3Polygon", address(aaveV3));*/

    aaveV2 = AaveV2Polygon(getAddress("AaveV2Polygon"));
    /*aaveV2 = new AaveV2Polygon();*/
    /*saveAddress("AaveV2Polygon", address(aaveV2));*/

    ovix = OvixPolygon(getAddress("OvixPolygon"));
    /*ovix = new OvixPolygon();*/
    /*saveAddress("OvixPolygon", address(ovix));*/

    dforce = DForcePolygon(getAddress("DForcePolygon"));
    /*dforce = new DForcePolygon();*/
    /*saveAddress("DForcePolygon", address(dforce));*/
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = aaveV2;
    providers[1] = aaveV3;
    address vault = chief.deployVault(
      address(factory), abi.encode(collateral, debtAsset, address(oracle), providers), 90
    );
    saveAddress(name, vault);
  }

  function _setNewPriceFeed(address asset, address feed) internal {
    _scheduleWithTimelock(
      address(oracle), abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed)
    );

    _executeWithTimelock(
      address(oracle), abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed)
    );
  }

  function _setVaultNewProviders(string memory vaultName) internal {
    BorrowingVault vault = BorrowingVault(payable(getAddress(vaultName)));

    ILendingProvider[] memory providers = new ILendingProvider[](4);
    providers[0] = aaveV3;
    providers[1] = aaveV2;
    providers[2] = dforce;
    providers[3] = ovix;
    bytes memory callData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    /*_scheduleWithTimelock(address(vault), callData);*/
    _executeWithTimelock(address(vault), callData);
  }

  function _setVaultNewRating(string memory vaultName, uint256 rating) internal {
    bytes memory callData =
      abi.encodeWithSelector(chief.setSafetyRating.selector, getAddress(vaultName), rating);
    _scheduleWithTimelock(address(chief), callData);
    /*_executeWithTimelock(address(chief), callData);*/
  }

  function _scheduleWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1 seconds);
  }

  function _executeWithTimelock(address target, bytes memory callData) internal {
    timelock.execute(target, 0, callData, 0x00, 0x00);
  }
}
