// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../utils/Routines.sol";
import {ForkingSetup} from "./ForkingSetup.sol";

// This is a test template meant to be used in a forked environement.
// Copy it to the dedicated chain directory and customize it.

// "ForkingSetup"
// Get some basic properties and contracts deployed and initialized or some utility functions:
// - collateralAsset - WETH
// - debtAsset - USDC
// - vault - a borrowing vault
// - (for a complete list check the contract)
// By inheriting from "ForkingSetup", all those are available in your test.
// It also takes care of the fork creation and selection.

// Inherit from "Routines" to get access to common functionalities like deposit to a vault.

contract TemplateTest is Routines, ForkingSetup {
  // Define more properties and contracts that could be used across your tests.
  // You can also override those coming from ForkingSetup.

  function setUp() public {
    // IMPORTANT
    // If you inherit from ForkingSetup, you need first to call deploy()
    // with the corresponding domain id. Find a list in ForkingSetup.sol.
    // If you need to add a new chain, feel free to do so in ForkingSetup.sol.
    // ex:
    // deploy(GOERLI_DOMAIN);

    // create and init more contracts and properties
  }

  function test_sample() public pure {
    assert(true);
  }
}
