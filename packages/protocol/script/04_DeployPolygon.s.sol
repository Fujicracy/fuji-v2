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
import {FujiOracle} from "../src/FujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployPolygon is ScriptPlus {
  IWETH9 WETH;
  Chief chief;
  BorrowingVaultFactory factory;
  IConnext connextHandler;

  ConnextRouter connextRouter;

  AaveV3Polygon aaveV3Polygon;
  FujiOracle oracle;
  ERC20 DAI;
  ERC20 USDC;
  ERC20 USDT;

  function setUp() public {
    chainName = "polygon";

    /*WETH = IWETH9(getAddress("WETH"));*/
    WETH = IWETH9(0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619);
    saveAddress("WETH", address(WETH));

    /*connextHandler = IConnext(getAddress("ConnextHandler"));*/
    connextHandler = IConnext(0x11984dc4465481512eb5b777E44061C158CF2259);
    saveAddress("ConnextHandler", address(connextHandler));
  }

  function run() public {
    vm.startBroadcast();

    /*DAI = ERC20(getAddress("DAI"));*/
    /*saveAddress("DAI", address(DAI));*/

    USDC = ERC20(getAddress("USDC"));
    /*USDC = ERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);*/
    /*saveAddress("USDC", address(USDC));*/

    /*USDT = ERC20(getAddress("USDT"));*/
    /*saveAddress("USDT", address(USDT));*/

    aaveV3Polygon = AaveV3Polygon(getAddress("AaveV3Polygon"));
    /*aaveV3Polygon = new AaveV3Polygon();*/
    /*saveAddress("AaveV3Polygon", address(aaveV3Polygon));*/

    chief = Chief(getAddress("Chief"));
    /*chief = new Chief(false, false);*/
    /*saveAddress("Chief", address(chief));*/
    /*bytes32 REBALANCER_ROLE = keccak256("REBALANCER_ROLE");*/
    /*chief.grantRole(REBALANCER_ROLE, msg.sender);*/

    oracle = FujiOracle(getAddress("FujiOracle"));
    /*address[] memory assets = new address[](2);*/
    /*assets[0] = address(WETH);*/
    /*assets[1] = address(USDC);*/
    /*address[] memory feeds = new address[](2);*/
    /*feeds[0] = 0xF9680D99D6C9589e2a93a78A04A279e509205945;*/
    /*feeds[1] = 0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7;*/
    /*oracle = new FujiOracle(assets, feeds, address(chief));*/
    /*saveAddress("FujiOracle", address(oracle));*/

    /*connextRouter = new ConnextRouter(WETH, connextHandler, chief);*/
    /*saveAddress("ConnextRouter", address(connextRouter));*/

    factory = BorrowingVaultFactory(getAddress("BorrowingVaultFactory"));
    /*factory = new BorrowingVaultFactory(address(chief));*/
    /*saveAddress("BorrowingVaultFactory", address(factory));*/
    /*factory.setContractCode(vm.getCode("BorrowingVault.sol:BorrowingVault"));*/
    /*chief.allowVaultFactory(address(factory), true);*/

    /*_deployVault(address(WETH), address(DAI), "BorrowingVault-WETHDAI");*/
    /*_deployVault(address(WETH), address(USDC), "BorrowingVault-WETHUSDC");*/
    /*_deployVault(address(WETH), address(USDT), "BorrowingVault-WETHUSDT");*/

    vm.stopBroadcast();
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    address vault =
      chief.deployVault(address(factory), abi.encode(collateral, debtAsset, address(oracle)), 95);
    saveAddress(name, vault);

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3Polygon;
    BorrowingVault(payable(vault)).setProviders(providers);

    BorrowingVault(payable(vault)).setActiveProvider(aaveV3Polygon);
  }
}
