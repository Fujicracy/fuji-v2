// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH} from "../../src/interfaces/IWETH.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {ICToken} from "../../src/interfaces/compoundV2/ICToken.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {CompoundV2} from "../../src/providers/mainnet/CompoundV2.sol";
import {IComptroller} from "../../src/interfaces/compoundV2/IComptroller.sol";
import {AaveV2} from "../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {Chief} from "../../src/Chief.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";
import {DSTestPlus} from "../utils/DSTestPlus.sol";

bool constant DEBUG = false;

contract AttackDoubleDeposit is DSTestPlus, CoreRoles {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 mainnetFork;

  IVault public vault;
  CompoundV2 public compoundV2;
  AaveV2 public aaveV2;
  Chief public chief;
  TimelockController public timelock;

  IWETH public weth;
  IERC20 public usdc;

  MockOracle mockOracle;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    mainnetFork = vm.createSelectFork("mainnet");

    weth = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");
    vm.label(address(weth), "weth");
    vm.label(address(usdc), "usdc");

    mockOracle = new MockOracle();

    _utils_setPrice(address(weth), address(usdc), 62500);
    _utils_setPrice(address(usdc), address(weth), 160000000000);

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));

    compoundV2 = new CompoundV2();
    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = compoundV2;
    providers[1] = aaveV2;

    vault = new BorrowingVault(
      address(weth),
      address(usdc),
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH",
      providers
    );
    // _utils_setupVaultProvider(vault, providers);
    // vault.setActiveProvider(compoundV2);
  }

  function _utils_setPrice(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(mockOracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));
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

  function _utils_setupVaultProvider(IVault vault_, ILendingProvider[] memory providers_) internal {
    _utils_setupTestRoles();
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers_);
    _callWithTimelock(address(vault_), sendData);
  }

  function _utils_doDeposit(address who, uint256 amount, IVault v) internal {
    vm.startPrank(who);
    SafeERC20.safeApprove(IERC20(v.asset()), address(v), amount);
    v.deposit(amount, who);
    vm.stopPrank();

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 shares = v.balanceOf(who);
    uint256 assetBalance = v.convertToAssets(shares);

    assertGe(assetBalance, amount);

    vm.warp(block.timestamp - 13 seconds);
    vm.roll(block.number - 1);
  }

  function _utils_doBorrow(address who, uint256 amount, IVault v) internal {
    vm.prank(who);
    v.borrow(amount, who, who);

    assertGe(IERC20(v.debtAsset()).balanceOf(who), amount);
  }

  function _utils_doPayback(address who, uint256 amount, IVault v) internal {
    uint256 prevDebt = v.balanceOfDebt(who);

    vm.startPrank(who);
    SafeERC20.safeApprove(IERC20(v.debtAsset()), address(v), amount);
    v.payback(amount, who);
    vm.stopPrank();

    uint256 debtDiff = prevDebt - amount;
    assertEq(v.balanceOfDebt(who), debtDiff);
  }

  function _utils_doWithdraw(address who, uint256 amount, IVault v) internal {
    IERC20 asset_ = IERC20(v.asset());
    uint256 prevBalance = asset_.balanceOf(who);
    vm.prank(who);
    v.withdraw(amount, who, who);

    uint256 newBalance = prevBalance + amount;
    assertEq(asset_.balanceOf(who), newBalance);
  }

  function test_twoDepositsInCompoundV2() public {
    // Two deposits are reverting because of overflow in maxMin function
    deal(address(weth), alice, DEPOSIT_AMOUNT);
    deal(address(weth), bob, DEPOSIT_AMOUNT);

    _utils_doDeposit(bob, DEPOSIT_AMOUNT, vault);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    _utils_doDeposit(alice, DEPOSIT_AMOUNT, vault);
  }

  function test_twoDepositsInAaveV2() public {
    vault.setActiveProvider(aaveV2);
    // Two deposits are reverting because of overflow in maxMin function
    deal(address(weth), alice, DEPOSIT_AMOUNT);
    deal(address(weth), bob, DEPOSIT_AMOUNT);
    _utils_doDeposit(bob, DEPOSIT_AMOUNT, vault);
    _utils_doDeposit(alice, DEPOSIT_AMOUNT, vault);
  }

  function test_maxWithdrawCompoundV2() public {
    deal(address(weth), alice, DEPOSIT_AMOUNT);
    deal(address(weth), bob, DEPOSIT_AMOUNT);
    _utils_doDeposit(bob, DEPOSIT_AMOUNT, vault);
    _utils_doDeposit(alice, DEPOSIT_AMOUNT, vault);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 theoreticalBobMaxWithdraw = vault.maxWithdraw(bob);
    uint256 theoreticalAliceMaxWithdraw = vault.maxWithdraw(alice);

    _utils_doWithdraw(bob, theoreticalBobMaxWithdraw, vault);
    _utils_doWithdraw(alice, theoreticalAliceMaxWithdraw, vault);

    assertGe(weth.balanceOf(alice), DEPOSIT_AMOUNT);
    assertGe(weth.balanceOf(bob), DEPOSIT_AMOUNT);
  }

  function test_maxWithdrawAaveV2() public {
    vault.setActiveProvider(aaveV2);

    deal(address(weth), alice, DEPOSIT_AMOUNT);
    deal(address(weth), bob, DEPOSIT_AMOUNT);
    _utils_doDeposit(bob, DEPOSIT_AMOUNT, vault);
    _utils_doDeposit(alice, DEPOSIT_AMOUNT, vault);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 theoreticalBobMaxWithdraw = vault.maxWithdraw(bob);
    uint256 theoreticalAliceMaxWithdraw = vault.maxWithdraw(alice);

    _utils_doWithdraw(bob, theoreticalBobMaxWithdraw, vault);
    _utils_doWithdraw(alice, theoreticalAliceMaxWithdraw, vault);

    assertGe(weth.balanceOf(alice), DEPOSIT_AMOUNT);
    assertGe(weth.balanceOf(bob), DEPOSIT_AMOUNT);
  }
}
