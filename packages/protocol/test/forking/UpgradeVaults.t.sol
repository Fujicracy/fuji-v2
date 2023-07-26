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

contract UpgradeVaultsTests is Routines, ForkingSetup2 {
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

  function test_upgradeImpl() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      uint256 depositAmount = allVaults[i].sampleDeposit;
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      do_deposit(depositAmount, IVault(vault), ALICE);
    }

    address newImplementation = address(new BorrowingVaultUpgradeable());
    bytes memory data = abi.encodeWithSelector(factory.upgradeTo.selector, newImplementation);
    _callWithTimelock(address(factory), data);

    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      uint256 depositAmount = allVaults[i].sampleDeposit;
      assertApproxEqAbs(IVault(vault).balanceOfAsset(ALICE), depositAmount, 1);
      /*assertEq(IVault(vault).balanceOfAsset(ALICE), depositAmount);*/
    }
  }

  function test_upgradeBeacon() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      uint256 depositAmount = allVaults[i].sampleDeposit;
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      do_deposit(depositAmount, IVault(vault), ALICE);
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
      uint256 depositAmount = allVaults[i].sampleDeposit;
      assertApproxEqAbs(IVault(vault).balanceOfAsset(ALICE), depositAmount, 1);
      /*assertEq(IVault(vault).balanceOfAsset(ALICE), depositAmount);*/
    }
  }

  function test_opsFromRouter() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      address asset = allVaults[i].asset;
      uint256 depositAmount = allVaults[i].sampleDeposit;
      uint256 borrowAmount = allVaults[i].sampleBorrow;
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      (IRouter.Action[] memory actions, bytes[] memory args) = getDepositAndBorrow(
        ALICE, ALICE_PK, depositAmount, borrowAmount, address(connextRouter), vault
      );
      deal(asset, ALICE, depositAmount);
      vm.startPrank(ALICE);
      IERC20(asset).safeIncreaseAllowance(address(connextRouter), depositAmount);
      connextRouter.xBundle(actions, args);
      assertApproxEqAbs(IVault(vault).balanceOfAsset(ALICE), depositAmount, 2);
      /*assertEq(IVault(vault).balanceOfAsset(ALICE), depositAmount);*/
    }
    vm.stopPrank();

    address newImplementation = address(new BorrowingVaultUpgradeable());
    bytes memory data = abi.encodeWithSelector(factory.upgradeTo.selector, newImplementation);
    _callWithTimelock(address(factory), data);

    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      address debtAsset = allVaults[i].debtAsset;
      uint256 depositAmount = allVaults[i].sampleDeposit;
      uint256 borrowAmount = allVaults[i].sampleBorrow;
      assertApproxEqAbs(IVault(vault).balanceOfAsset(ALICE), depositAmount, 2);
      /*assertEq(IVault(vault).balanceOfAsset(ALICE), depositAmount);*/

      (IRouter.Action[] memory actions, bytes[] memory args) = getPaybackAndWithdraw(
        ALICE, ALICE_PK, borrowAmount, depositAmount, address(connextRouter), vault
      );

      vm.startPrank(ALICE);
      IERC20(debtAsset).safeIncreaseAllowance(address(connextRouter), borrowAmount);
      connextRouter.xBundle(actions, args);
      assertGe(IVault(vault).balanceOfAsset(ALICE), 0);
      /*assertEq(IVault(vault).balanceOfAsset(ALICE), 0);*/
    }
    vm.stopPrank();
  }
}
