// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ProposedOwnable, ProposedOwnableUpgradeable} from "../../../contracts/core/shared/ProposedOwnable.sol";

import "../../utils/ForgeHelper.sol";
import "../../utils/Mock.sol";

contract ProposedOwnableTest is ProposedOwnable, ForgeHelper {
  // ============ Storage ============
  address _default = address(123123);

  // ============ Test set up ============
  function setUp() public {
    _setOwner(_default);
    assertEq(this.owner(), _default);
  }

  // ============ Utils ============
  function utils_proposeNewOwnerAndAssert(address proposed) public {
    // Assert change
    address current = this.owner();
    assertTrue(proposed != current);

    // Assert event
    vm.expectEmit(true, true, true, true);
    emit OwnershipProposed(proposed);

    // Call
    vm.prank(current);
    this.proposeNewOwner(proposed);

    // Assert changes
    assertEq(this.owner(), current);
    assertEq(this.proposed(), proposed);
    assertEq(this.proposedTimestamp(), block.timestamp);
  }

  function utils_acceptNewOwnerAndAssert(address proposed) public {
    // Assert change
    address current = this.owner();
    assertTrue(proposed != current);

    // Assert event
    vm.expectEmit(true, true, true, true);
    emit OwnershipTransferred(current, proposed);

    // Call
    bool isRenounce = proposed == address(0);
    if (isRenounce) {
      vm.prank(current);
      this.renounceOwnership();
    } else {
      vm.prank(proposed);
      this.acceptProposedOwner();
    }

    // Assert changes
    assertEq(this.owner(), proposed);
    assertEq(this.proposed(), address(0));
    assertEq(this.proposedTimestamp(), 0);
    assertEq(this.renounced(), isRenounce);
  }

  function utils_transferOwnership(address proposed) public {
    // Propose new owner
    utils_proposeNewOwnerAndAssert(proposed);

    // Fast-forward from delay
    vm.warp(block.timestamp + 7 days + 1);

    // Accept new owner
    utils_acceptNewOwnerAndAssert(proposed);
  }

  // ============ owner ============
  // tested in assertion functions

  // ============ proposed ============
  // tested in assertion functions

  // ============ proposedTimestamp ============
  // tested in assertion functions

  // ============ delay ============
  function test_ProposedOwnable__delay_works() public {
    assertEq(this.delay(), 7 days);
  }

  // ============ renounced ============
  // tested in assertions

  // ============ proposeNewOwner ============
  function test_ProposedOwnable__proposeNewOwner_failsIfNotOwner() public {
    vm.expectRevert(ProposedOwnable__onlyOwner_notOwner.selector);
    this.proposeNewOwner(address(12));
  }

  function test_ProposedOwnable__proposeNewOwner_failsIfNoChange() public {
    utils_proposeNewOwnerAndAssert(address(12));

    vm.expectRevert(ProposedOwnable__proposeNewOwner_invalidProposal.selector);
    vm.prank(_default);
    this.proposeNewOwner(address(12));
  }

  function test_ProposedOwnable__proposeNewOwner_failsIfProposingOwner() public {
    vm.expectRevert(ProposedOwnable__proposeNewOwner_noOwnershipChange.selector);
    vm.prank(_default);
    this.proposeNewOwner(_default);
  }

  function test_ProposedOwnable__proposeNewOwner_works() public {
    utils_proposeNewOwnerAndAssert(address(12));
  }

  // ============ renounceOwnership ============
  function test_ProposedOwnable__renounceOwnership_failsIfNotOwner() public {
    utils_proposeNewOwnerAndAssert(address(0));

    vm.expectRevert(ProposedOwnable__onlyOwner_notOwner.selector);
    this.renounceOwnership();
  }

  function test_ProposedOwnable__renounceOwnership_failsIfNoProposal() public {
    vm.expectRevert(ProposedOwnable__renounceOwnership_noProposal.selector);
    vm.prank(_default);
    this.renounceOwnership();
  }

  function test_ProposedOwnable__renounceOwnership_failsIfDelayNotElapsed() public {
    utils_proposeNewOwnerAndAssert(address(1));

    vm.prank(_default);
    vm.expectRevert(ProposedOwnable__renounceOwnership_delayNotElapsed.selector);
    this.renounceOwnership();
  }

  function test_ProposedOwnable__renounceOwnership_failsIfProposedNonNull() public {
    utils_proposeNewOwnerAndAssert(address(1));
    vm.warp(block.timestamp + this.delay() + 1);

    vm.prank(_default);
    vm.expectRevert(ProposedOwnable__renounceOwnership_invalidProposal.selector);
    this.renounceOwnership();
  }

  function test_ProposedOwnable__renounceOwnership_works() public {
    assertTrue(!this.renounced());

    utils_transferOwnership(address(0));
    assertTrue(this.renounced());
  }

  // ============ acceptProposedOwner ============
  function test_ProposedOwnable__acceptProposedOwner_failsIfNotProposed() public {
    address proposed = address(12);
    utils_proposeNewOwnerAndAssert(proposed);

    vm.expectRevert(ProposedOwnable__onlyProposed_notProposedOwner.selector);
    this.acceptProposedOwner();
  }

  function test_ProposedOwnable__acceptProposedOwner_failsIfDelayNotElapsed() public {
    address proposed = address(12);
    utils_proposeNewOwnerAndAssert(proposed);

    vm.prank(proposed);
    vm.expectRevert(ProposedOwnable__acceptProposedOwner_delayNotElapsed.selector);
    this.acceptProposedOwner();
  }

  function test_ProposedOwnable__acceptProposedOwner_works() public {
    utils_transferOwnership(address(12));
  }
}

contract OwnableHelper is Initializable, ProposedOwnableUpgradeable {
  function initialize() public initializer {
    __ProposedOwnable_init();
  }
}

contract Proxy is ERC1967Proxy {
  constructor(address _logic, bytes memory _data) ERC1967Proxy(_logic, _data) {}

  function upgradeTo(address newImpl) public {
    _upgradeTo(newImpl);
  }

  function implementation() public returns (address) {
    return _implementation();
  }
}

contract ProposedOwnableUpgradeableTest is ForgeHelper {
  OwnableHelper upgradeable;
  Proxy proxy;

  function setUp() public {
    OwnableHelper impl = new OwnableHelper();

    proxy = new Proxy(address(impl), abi.encodeWithSelector(OwnableHelper.initialize.selector, bytes("")));

    upgradeable = OwnableHelper(payable(address(proxy)));
  }

  function test_ProposedOwnableUpgradeable__initialize_works() public {
    assertEq(upgradeable.owner(), address(this));
  }

  function test_ProposedOwnableUpgradeable__upgrade_works() public {
    OwnableHelper impl = new OwnableHelper();
    proxy.upgradeTo(address(impl));
    assertEq(proxy.implementation(), address(impl));
    assertEq(upgradeable.owner(), address(this));
  }
}
