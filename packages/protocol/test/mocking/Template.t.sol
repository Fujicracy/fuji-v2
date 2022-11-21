// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../utils/Routines.sol";
import {MockingSetup} from "./MockingSetup.sol";

// This is a test template meant to be used in unit testing.
// It's chain agnostic and tests run in isolation.
// Copy it to the dedicated directory and customize it.

// "MockingSetup"
// Get some basic properties and contracts deployed and initialized or some utility functions:
// - collateralAsset - MockERC20
// - debtAsset - MockERC20
// - vault - a borrowing vault
// - (for a complete list check the contract)
// By inheriting from "MockingSetup", all those are available in your test.

// Inherit from "Routines" to get access to common functionalities like deposit to a vault.

contract TemplateTest is Routines, MockingSetup {
  // Define more properties and contracts that could be used across your tests.

  function setUp() public {
    // create and init more contracts and properties
  }

  function test_sample() public pure {
    assert(true);
  }
}
