// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {IConnextHandler} from "nxtp/core/connext/interfaces/IConnextHandler.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {XRouter} from "../src/XRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {AaveV3Goerli} from "../src/providers/goerli/AaveV3Goerli.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";

contract DeployGoerli is ScriptPlus {
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
    weth = IWETH9(0x2e3A2fb8473316A02b8A297B982498E661E1f6f5);
    connextHandler = IConnextHandler(0x6c9a905Ab3f4495E2b47f5cA131ab71281E0546e);
    connextTestToken = 0x26FE8a8f86511d678d031a022E48FfF41c6a3e3b;

    asset = 0x2e3A2fb8473316A02b8A297B982498E661E1f6f5; // weth
    debtAsset = 0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43; // usdc
    oracle = 0xD7E3AE6f48A1D442069b32a5Aa6e315B111B992C;
  }

  function run() public {
    vm.startBroadcast();

    aaveV3 = new AaveV3Goerli();
    saveAddress("./deployments/goerli/AaveV3Goerli", address(aaveV3));

    router = new XRouter(weth, connextHandler);
    saveAddress("./deployments/goerli/XRouter", address(router));

    vault = new BorrowingVault(
      asset,
      debtAsset,
      oracle,
      address(0)
    );
    saveAddress("./deployments/goerli/BorrowingVault", address(vault));

    vault.setActiveProvider(aaveV3);
    router.registerVault(IVault(address(vault)));

    router.setTestnetToken(connextTestToken);

    vm.stopBroadcast();
  }
}
