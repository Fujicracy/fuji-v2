// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";

contract SetupGoerliRouter is ScriptPlus {
  ConnextRouter public connextRouter;

  function setUp() public {
    chainName = "goerli";

    address addr = getAddress("ConnextRouter");
    connextRouter = ConnextRouter(payable(addr));
  }

  function run() public {
    vm.startBroadcast();
    address optAddr = getAddressAt("ConnextRouter", "optimism-goerli");
    connextRouter.setRouter(1735356532, optAddr);
    vm.stopBroadcast();
  }
}
