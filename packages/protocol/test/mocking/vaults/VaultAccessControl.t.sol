// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {MockProvider} from "../../../src/mocks/MockProvider.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BaseVault} from "../../../src/abstracts/BaseVault.sol";
import {SystemAccessControl} from "../../../src/access/SystemAccessControl.sol";

contract VaultAccessControlUnitTests is MockingSetup {
  event MinDepositAmountChanged(uint256 newMinDeposit);
  event DepositCapChanged(uint256 newDepositCap);

  function setUp() public {}

  /// BaseVault parameter changing fuzz tests
  function test_tryFoeSetMinDepositAmount(address foe, uint256 amount) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
        && amount > 0
    );
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    vault.setMinAmount(amount);
    vm.stopPrank();
  }

  function test_tryFoeSetDepositCap(address foe, uint256 amount) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
        && amount > 0
    );
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    vault.setDepositCap(amount);
    vm.stopPrank();
  }

  function test_tryFoeSetProviders(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    ILendingProvider maliciousProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = maliciousProvider;
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    vault.setProviders(providers);
    vm.stopPrank();
  }

  function test_tryFoeSetActiveProvider(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    ILendingProvider maliciousProvider = new MockProvider();
    vm.expectRevert(
      abi.encodeWithSelector(
        SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
      )
    );
    vm.prank(foe);
    vault.setActiveProvider(maliciousProvider);
    vm.stopPrank();
  }

  /// BorrowingVault borrowing parameters changing tests

  function test_tryFoeSetOracle(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    MockOracle maliciousOracle = new MockOracle();
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    vault.setOracle(maliciousOracle);
    vm.stopPrank();
  }

  function test_tryFoeSetMaxLtv(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    uint256 newMaliciousMaxLtv = 1 * 1e16;
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    vault.setMaxLtv(newMaliciousMaxLtv);
    vm.stopPrank();
  }

  function test_tryFoeSetLiqRatio(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    uint256 newMaliciousLiqRatio = 10 * 1e16;
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    vault.setLiqRatio(newMaliciousLiqRatio);
    vm.stopPrank();
  }
}
