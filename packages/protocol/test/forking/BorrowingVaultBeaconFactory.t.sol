// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../utils/Routines.sol";
import {ForkingSetup2} from "./ForkingSetup2.sol";
import {VaultBeaconProxy} from "../../src/vaults/VaultBeaconProxy.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {BorrowingVaultUpgradeable} from "../../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {BorrowingVaultBeaconFactory} from
  "../../src/vaults/borrowing/BorrowingVaultBeaconFactory.sol";

contract BorrowingVaultBeaconFactoryTests is Routines, ForkingSetup2 {
  using SafeERC20 for IERC20;

  bytes32 internal constant _BEACON_SLOT =
    0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork();

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    setOrDeployBorrowingVaults(false);
  }

  function test_newImpl() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      do_deposit(DEPOSIT_AMOUNT, IVault(vault), ALICE);
    }

    address newImplementation = address(new BorrowingVaultUpgradeable());
    bytes memory data = abi.encodeWithSelector(factory.upgradeTo.selector, newImplementation);
    _callWithTimelock(address(factory), data);

    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      assertApproxEqAbs(IVault(vault).balanceOfAsset(ALICE), DEPOSIT_AMOUNT, 1);
      /*assertEq(IVault(vault).balanceOfAsset(ALICE), DEPOSIT_AMOUNT);*/
    }
  }

  function test_newBeacon() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      do_deposit(DEPOSIT_AMOUNT, IVault(vault), ALICE);
    }

    address newBeacon = address(new BorrowingVaultBeaconFactory(address(chief), implementation));
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      bytes memory data = abi.encodeWithSelector(
        VaultBeaconProxy(payable(vault)).upgradeBeaconAndCall.selector, newBeacon, "", false
      );
      _callWithTimelock(vault, data);
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), newBeacon);
    }

    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      assertEq(IVault(vault).balanceOfAsset(ALICE), DEPOSIT_AMOUNT);
    }
  }

  function test_opsFromRouter() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      address asset = IVault(vault).asset();
      (IRouter.Action[] memory actions, bytes[] memory args) = getDepositAndBorrow(
        ALICE, ALICE_PK, DEPOSIT_AMOUNT, BORROW_AMOUNT, address(connextRouter), vault
      );
      deal(asset, ALICE, DEPOSIT_AMOUNT);
      vm.startPrank(ALICE);
      IERC20(asset).safeIncreaseAllowance(address(connextRouter), DEPOSIT_AMOUNT);
      connextRouter.xBundle(actions, args);
      assertEq(IVault(vault).balanceOfAsset(ALICE), DEPOSIT_AMOUNT);
    }
    vm.stopPrank();

    address newImplementation = address(new BorrowingVaultUpgradeable());
    bytes memory data = abi.encodeWithSelector(factory.upgradeTo.selector, newImplementation);
    _callWithTimelock(address(factory), data);

    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      assertEq(IVault(vault).balanceOfAsset(ALICE), DEPOSIT_AMOUNT);

      address debtAsset = IVault(vault).debtAsset();
      (IRouter.Action[] memory actions, bytes[] memory args) = getPaybackAndWithdraw(
        ALICE, ALICE_PK, BORROW_AMOUNT, DEPOSIT_AMOUNT, address(connextRouter), vault
      );

      vm.startPrank(ALICE);
      IERC20(debtAsset).safeIncreaseAllowance(address(connextRouter), DEPOSIT_AMOUNT);
      connextRouter.xBundle(actions, args);
      assertEq(IVault(vault).balanceOfAsset(ALICE), 0);
    }
    vm.stopPrank();
  }
}
