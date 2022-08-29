// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";

contract SetupOptimismGoerliRouter is ScriptPlus {
  ConnextRouter public connextRouter;

  function setUp() public {
    chainName = "optimism-goerli";

    address addr = getAddress("ConnextRouter");
    connextRouter = ConnextRouter(payable(addr));
  }

  function run() public {
    vm.startBroadcast();
    address optAddr = getAddressAt("ConnextRouter", "goerli");
    connextRouter.setRouter(1735353714, optAddr);
    vm.stopBroadcast();
  }
}
