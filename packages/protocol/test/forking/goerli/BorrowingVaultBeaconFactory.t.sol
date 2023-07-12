// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup2} from "../ForkingSetup2.sol";
import {VaultBeaconProxy} from "../../../src/vaults/VaultBeaconProxy.sol";
import {AaveV3Goerli} from "../../../src/providers/goerli/AaveV3Goerli.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVaultUpgradeable} from
  "../../../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {BorrowingVaultBeaconFactory} from
  "../../../src/vaults/borrowing/BorrowingVaultBeaconFactory.sol";

contract BorrowingVaultBeaconFactoryTests is Routines, ForkingSetup2 {
  using SafeERC20 for IERC20;

  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  AaveV3Goerli aaveV3;

  bytes32 internal constant _BEACON_SLOT =
    0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  address[] vaults;

  function setUp() public {
    setUpFork("goerli");

    aaveV3 = AaveV3Goerli(getAddress("Aave_V3_Goerli"));
    vm.label(address(aaveV3), "AaveV3Goerli");

    vm.startPrank(msg.sender);
    setOrDeployChief(true);
    setOrDeployConnextRouter(true);
    setOrDeployFujiOracle(true);
    setOrDeployBorrowingVaultFactory(true, true);
    vaults = deployBorrowingVaults();
    vm.stopPrank();
    /*setBorrowingVaults();*/
  }

  function test_newImpl() public {
    uint256 len = vaults.length;
    for (uint256 i; i < len; i++) {
      address vault = vaults[i];
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      do_deposit(DEPOSIT_AMOUNT, IVault(vault), ALICE);
    }

    vm.startPrank(msg.sender);
    address newImplementation = address(new BorrowingVaultUpgradeable());
    bytes memory data = abi.encodeWithSelector(factory.upgradeTo.selector, newImplementation);
    _callWithTimelock(address(factory), data);
    vm.stopPrank();

    for (uint256 i; i < len; i++) {
      address vault = vaults[i];
      assertEq(IVault(vault).balanceOf(ALICE), DEPOSIT_AMOUNT);
    }
  }

  function test_newBeacon() public {
    uint256 len = vaults.length;
    for (uint256 i; i < len; i++) {
      address vault = vaults[i];
      bytes32 b = vm.load(vault, _BEACON_SLOT);
      assertEq(abi.decode(abi.encode(b), (address)), address(factory));

      do_deposit(DEPOSIT_AMOUNT, IVault(vault), ALICE);
    }

    vm.startPrank(msg.sender);
    address newBeacon = address(new BorrowingVaultBeaconFactory(address(chief), implementation));
    for (uint256 i; i < len; i++) {
      address vault = vaults[i];
      bytes memory data = abi.encodeWithSelector(
        VaultBeaconProxy(payable(vault)).upgradeBeaconAndCall.selector, newBeacon, "", false
      );
      _callWithTimelock(vault, data);
    }
    vm.stopPrank();

    for (uint256 i; i < len; i++) {
      address vault = vaults[i];
      assertEq(IVault(vault).balanceOf(ALICE), DEPOSIT_AMOUNT);
    }
  }

  function test_depositAndBorrow() public {
    uint256 len = vaults.length;
    for (uint256 i; i < len; i++) {
      address vault = vaults[i];
      address asset = IVault(vault).asset();
      (IRouter.Action[] memory actions, bytes[] memory args) = _getDepositAndBorrow(
        ALICE, ALICE_PK, DEPOSIT_AMOUNT, BORROW_AMOUNT, address(connextRouter), vault
      );
      deal(asset, ALICE, DEPOSIT_AMOUNT);
      vm.startPrank(ALICE);
      IERC20(asset).safeIncreaseAllowance(address(connextRouter), DEPOSIT_AMOUNT);
      connextRouter.xBundle(actions, args);
      assertEq(IVault(vault).balanceOf(ALICE), DEPOSIT_AMOUNT);
    }
  }
}
