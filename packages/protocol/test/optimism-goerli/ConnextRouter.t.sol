// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ConnextRouterTestsSuite} from "../ConnextRouterTestsSuite.sol";

contract ConnextRouterTest is ConnextRouterTestsSuite {
  function setUp() public {
    vm.selectFork(optimismGoerliFork);
    deploy(OPTIMISM_GOERLI_DOMAIN);
  }
}
