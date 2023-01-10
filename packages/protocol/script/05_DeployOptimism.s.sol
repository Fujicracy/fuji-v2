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
import {AaveV3Optimism} from "../src/providers/optimism/AaveV3Optimism.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract DeployOptimism is ScriptPlus {
  IWETH9 WETH;
  Chief chief;
  BorrowingVaultFactory factory;
  IConnext connextHandler;

  ConnextRouter connextRouter;

  AaveV3Optimism aaveV3Optimism;
  FujiOracle oracle;
  ERC20 DAI;
  ERC20 USDC;
  ERC20 USDT;

  function setUp() public {
    chainName = "optimism";

    WETH = IWETH9(getAddress("WETH"));
    /*saveAddress("WETH", address(WETH));*/

    connextHandler = IConnext(getAddress("ConnextHandler"));
    /*saveAddress("ConnextHandler", address(connextHandler));*/
  }

  function run() public {
    vm.startBroadcast();

    /*DAI = ERC20(getAddress("DAI"));*/
    /*saveAddress("DAI", address(DAI));*/

    USDC = ERC20(getAddress("USDC"));
    /*saveAddress("USDC", address(USDC));*/

    /*USDT = ERC20(getAddress("USDT"));*/
    /*saveAddress("USDT", address(USDT));*/

    aaveV3Optimism = AaveV3Optimism(getAddress("AaveV3Optimism"));
    /*aaveV3Optimism = new AaveV3Optimism();*/
    /*saveAddress("AaveV3Optimism", address(aaveV3Optimism));*/

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
    /*feeds[0] = 0x13e3Ee699D1909E989722E753853AE30b17e08c5;*/
    /*feeds[1] = 0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3;*/
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
    _deployVault(address(WETH), address(USDC), "BorrowingVault-WETHUSDC");
    /*_deployVault(address(WETH), address(USDT), "BorrowingVault-WETHUSDT");*/

    vm.stopBroadcast();
  }

  function _deployVault(address collateral, address debtAsset, string memory name) internal {
    address vault =
      chief.deployVault(address(factory), abi.encode(collateral, debtAsset, address(oracle)), "A+");
    saveAddress(name, vault);

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV3Optimism;
    BorrowingVault(payable(vault)).setProviders(providers);

    BorrowingVault(payable(vault)).setActiveProvider(aaveV3Optimism);
  }
}
