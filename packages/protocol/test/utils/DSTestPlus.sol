// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Vm} from "@std/Vm.sol";
import {Test} from "forge-std/Test.sol";

contract DSTestPlus is Test {
  uint32 public GOERLI_DOMAIN = 1735353714;
  uint32 public OPTIMISM_GOERLI_DOMAIN = 1735356532;

  // Chain IDs
  uint32 public mainnetChainId = 1;
  uint32 public goerliChainId = 5;
  uint32 public optimismGoerliChainId = 420;
  uint32 public polygonChainId = 137;
  uint32 public arbitrumChainId = 42161;
}
