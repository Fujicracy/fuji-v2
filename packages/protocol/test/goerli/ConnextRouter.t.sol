// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ConnextRouterTestsSuite} from "../ConnextRouterTestsSuite.sol";

contract ConnextRouterTest is ConnextRouterTestsSuite {
  function setUp() public {
    vm.selectFork(goerliFork);
    deploy2(3331);
  }
}
