// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnextHandler} from "nxtp/core/connext/interfaces/IConnextHandler.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {XRouter} from "../src/XRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {AaveV3Rinkeby} from "../src/providers/rinkeby/AaveV3Rinkeby.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";

contract DeployRinkeby is ScriptPlus {
  IVault public vault;
  XRouter public router;
  ILendingProvider public aaveV3;

  IWETH9 public weth;
  IConnextHandler public connextHandler;

  address public connextTestToken;
  address public asset;
  address public debtAsset;
  address public oracle;

  function setUp() public {
    weth = IWETH9(0xd74047010D77c5901df5b0f9ca518aED56C85e8D);
    connextHandler = IConnextHandler(0x4cAA6358a3d9d1906B5DABDE60A626AAfD80186F);
    connextTestToken = 0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9;

    asset = 0xd74047010D77c5901df5b0f9ca518aED56C85e8D; // weth
    debtAsset = 0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774; // usdc
    oracle = 0xD7E3AE6f48A1D442069b32a5Aa6e315B111B992C;
  }

  function run() public {
    vm.startBroadcast();

    aaveV3 = new AaveV3Rinkeby();
    saveAddress("./deployments/rinkeby/AaveV3Rinkeby", address(aaveV3));

    router = new XRouter(weth, connextHandler);
    saveAddress("./deployments/rinkeby/XRouter", address(router));

    vault = new BorrowingVault(
      asset,
      debtAsset,
      oracle,
      address(0)
    );
    saveAddress("./deployments/rinkeby/BorrowingVault", address(vault));

    vault.setActiveProvider(aaveV3);
    router.registerVault(IVault(address(vault)));

    router.setTestnetToken(connextTestToken);

    vm.stopBroadcast();
  }
}
