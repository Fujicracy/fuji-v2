// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {Chief} from "../../src/Chief.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IVaultPermissions} from "../../src/interfaces/IVaultPermissions.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";

contract MockingSetup is CoreRoles, Test {
  uint256 public constant ALICE_PK = 0xA;
  address public ALICE = vm.addr(ALICE_PK);
  uint256 public constant BOB_PK = 0xB;
  address public BOB = vm.addr(BOB_PK);
  uint256 public constant CHARLIE_PK = 0xC;
  address public CHARLIE = vm.addr(CHARLIE_PK);

  IVault public vault;
  Chief public chief;
  TimelockController public timelock;
  MockOracle oracle;

  address public collateralAsset;
  address public debtAsset;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");

    MockERC20 tWETH = new MockERC20("Test WETH", "tWETH");
    collateralAsset = address(tWETH);
    vm.label(collateralAsset, "testWETH");

    MockERC20 tDAI = new MockERC20("Test DAI", "tDAI");
    debtAsset = address(tDAI);
    vm.label(debtAsset, "testDAI");

    oracle = new MockOracle();
    // WETH and DAI prices by Nov 11h 2022
    oracle.setUSDPriceOf(collateralAsset, 796341757142697);
    oracle.setUSDPriceOf(debtAsset, 100000000);

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    timelock = TimelockController(payable(chief.timelock()));

    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));
    _grantRoleChief(HOUSE_KEEPER_ROLE, address(this));

    vault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(oracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );
  }

  function _dealMockERC20(address mockerc20, address to, uint256 amount) internal {
    MockERC20(mockerc20).mint(to, amount);
  }

  function _callWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(target, 0, callData, 0x00, 0x00);
    rewind(2 days);
  }

  function _grantRoleChief(bytes32 role, address account) internal {
    bytes memory sendData = abi.encodeWithSelector(chief.grantRole.selector, role, account);
    _callWithTimelock(address(chief), sendData);
  }

  function _setVaultProviders(IVault v, ILendingProvider[] memory providers) internal {
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers);
    _callWithTimelock(address(v), sendData);
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function _getPermitBorrowArgs(
    LibSigUtils.Permit memory permit,
    uint256 ownerPrivateKey,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 structHash = LibSigUtils.getStructHashBorrow(permit);
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      structHash
    );
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
    deadline = permit.deadline;
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function _getPermitWithdrawArgs(
    LibSigUtils.Permit memory permit,
    uint256 ownerPrivateKey,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      LibSigUtils.getStructHashAsset(permit)
    );
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
    deadline = permit.deadline;
  }
}
