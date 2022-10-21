// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {Chief} from "../src/Chief.sol";
import {CoreRoles} from "../src/access/CoreRoles.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IFujiOracle} from "../src/interfaces/IFujiOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BaseVault} from "../src/abstracts/BaseVault.sol";
import {SystemAccessControl} from "../src/access/SystemAccessControl.sol";

interface IBorrowingVault_TestingOnly is IVault {
  function setOracle(IFujiOracle newOracle) external;
  function setMaxLtv(uint256 maxLtv_) external;
  function setLiqRatio(uint256 liqRatio_) external;
}

contract VaultAccessControlUnitTests is DSTestPlus, CoreRoles {
  event MinDepositAmountChanged(uint256 newMinDeposit);
  event DepositCapChanged(uint256 newDepositCap);

  IVault public vault;
  Chief public chief;
  TimelockController public timelock;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);

  uint256 bobPkey = 0xB;
  address bob = vm.addr(bobPkey);

  function setUp() public {
    vm.label(alice, "Alice");
    vm.label(bob, "Bob");

    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    _utils_setupOracle(address(oracle), address(asset), address(debtAsset));

    mockProvider = new MockProvider();

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );

    _utils_setupVaultProvider();
  }

  /// Utilities

  function _utils_setupOracle(address oracle_, address asset1, address asset2) internal {
    // WETH and DAI prices: 2000 DAI/WETH
    _utils_setPrice(oracle_, asset1, asset2, 5e14);
    _utils_setPrice(oracle_, asset2, asset1, 2000e18);
  }

  function _utils_setPrice(address oracle_, address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      oracle_,
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_setupVaultProvider() internal {
    _utils_setupTestRoles();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    bytes memory sendData = abi.encodeWithSelector(vault.setProviders.selector, providers);
    _utils_callWithTimelock(sendData);
    vault.setActiveProvider(mockProvider);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(LIQUIDATOR_ROLE, address(this));
  }

  function _utils_callWithTimelock(bytes memory sendData) internal {
    timelock.schedule(address(vault), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(vault), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  /// BaseVault parameter changing fuzz tests

  function test_tryFoeSetMinDepositAmount(address foe, uint256 amount) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
        && amount > 0
    );
    vm.expectRevert(SystemAccessControl.SystemAccessControl__callerIsNotTimelock.selector);
    vm.prank(foe);
    vault.setMinDepositAmount(amount);
    vm.stopPrank();
  }

  function test_tryFoeSetDepositCap(address foe, uint256 amount) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
        && amount > 0
    );
    vm.expectRevert(SystemAccessControl.SystemAccessControl__callerIsNotTimelock.selector);
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
    vm.expectRevert(SystemAccessControl.SystemAccessControl__callerIsNotTimelock.selector);
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
        SystemAccessControl.SystemAccessControl__missingRole.selector, foe, REBALANCER_ROLE
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
    vm.expectRevert(SystemAccessControl.SystemAccessControl__callerIsNotTimelock.selector);
    IBorrowingVault_TestingOnly bvault = IBorrowingVault_TestingOnly(address(vault));
    vm.prank(foe);
    bvault.setOracle(maliciousOracle);
    vm.stopPrank();
  }

  function test_tryFoeSetMaxLtv(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    uint256 newMaliciousMaxLtv = 1 * 1e16;
    vm.expectRevert(SystemAccessControl.SystemAccessControl__callerIsNotTimelock.selector);
    IBorrowingVault_TestingOnly bvault = IBorrowingVault_TestingOnly(address(vault));
    vm.prank(foe);
    bvault.setMaxLtv(newMaliciousMaxLtv);
    vm.stopPrank();
  }

  function test_tryFoeSetLiqRatio(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    uint256 newMaliciousLiqRatio = 10 * 1e16;
    vm.expectRevert(SystemAccessControl.SystemAccessControl__callerIsNotTimelock.selector);
    IBorrowingVault_TestingOnly bvault = IBorrowingVault_TestingOnly(address(vault));
    vm.prank(foe);
    bvault.setLiqRatio(newMaliciousLiqRatio);
    vm.stopPrank();
  }
}
