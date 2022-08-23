// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {VaultTestsSuite} from "../VaultTestsSuite.sol";

contract VaultTest is VaultTestsSuite {
  function setUp() public {
    vm.selectFork(rinkebyFork);
    deploy(1111);
  }
}
