// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {ChainlinkComputedFeedLido} from "../../../src/helpers/ChainlinkComputedFeedLido.sol";

contract LidoComputedOracle is Test {
  ChainlinkComputedFeedLido public lidoOracle;

  function setUp() public {
    uint256 forkId = vm.createFork("mainnet");
    vm.selectFork(forkId);

    lidoOracle = new ChainlinkComputedFeedLido(
      'wsteth/usd computed', 8, 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0, 0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8, 3600
    );
  }

  function test_getLastestAnswer() public view {
    uint256 price = uint256(lidoOracle.latestAnswer());
    console.log("usd per wsteth", price);
  }
}
