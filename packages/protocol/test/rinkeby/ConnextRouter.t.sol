// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ConnextRouterTestsSuite} from "../ConnextRouterTestsSuite.sol";

contract ConnextRouterTest is ConnextRouterTestsSuite {
  function setUp() public {
    vm.selectFork(rinkebyFork);
    deploy2(1111);
  }
}
