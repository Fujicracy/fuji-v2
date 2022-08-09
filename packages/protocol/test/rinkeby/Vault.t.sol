// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {VaultTestsSuite} from "../VaultTestsSuite.sol";

contract VaultTest is VaultTestsSuite {
  function setUp() public {
    vm.selectFork(rinkebyFork);
    deploy(1111);
  }
}
