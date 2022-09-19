// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {XConsole} from "./Console.sol";

import {Vm} from "@std/Vm.sol";
import {Test} from "forge-std/Test.sol";

contract DSTestPlus is Test {
  XConsole console = new XConsole();

  uint32 public GOERLI_DOMAIN = 1735353714;
  uint32 public OPTIMISM_GOERLI_DOMAIN = 1735356532;

  // Chain IDs
  uint32 public mainnetChainId = 1;
  uint32 public goerliChainId = 5;
  uint32 public opimismGoerliChainId = 420;
}
