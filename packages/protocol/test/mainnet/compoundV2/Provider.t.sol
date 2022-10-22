// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IWETH9} from "../../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {CompoundV2} from "../../../src/providers/mainnet/CompoundV2.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {Chief} from "../../../src/Chief.sol";
import {CoreRoles} from "../../../src/access/CoreRoles.sol";
import {DSTestPlus} from "../../utils/DSTestPlus.sol";

bool constant DEBUG = false;

contract ProviderTest is DSTestPlus, CoreRoles {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 mainnetFork;

  IVault public vault;
  ILendingProvider public compoundV2;
  Chief public chief;
  TimelockController public timelock;

  IWETH9 public weth;
  IERC20 public usdc;

  MockOracle mockOracle;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    mainnetFork = vm.createSelectFork("mainnet");

    weth = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");
    vm.label(address(weth), "weth");
    vm.label(address(usdc), "usdc");

    mockOracle = new MockOracle();

    mockOracle.setPriceOf(address(weth), address(usdc), 62500);
    mockOracle.setPriceOf(address(usdc), address(weth), 160000000000);

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    vault = new BorrowingVault(
      address(weth),
      address(usdc),
      address(mockOracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );

    compoundV2 = new CompoundV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV2;

    _utils_setupVaultProvider(vault, providers);
    vault.setActiveProvider(compoundV2);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(LIQUIDATOR_ROLE, address(this));
  }

  function _utils_callWithTimeLock(bytes memory sendData, IVault vault_) internal {
    timelock.schedule(address(vault_), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(vault_), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProvider(IVault vault_, ILendingProvider[] memory providers_) internal {
    _utils_setupTestRoles();
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers_);
    _utils_callWithTimeLock(sendData, vault_);
  }

  function _utils_doDeposit(address who, uint256 amount) internal {
    vm.startPrank(who);
    SafeERC20.safeApprove(IERC20(address(weth)), address(vault), amount);
    vault.deposit(amount, who);
    assertEq(vault.balanceOf(who), amount);
    vm.stopPrank();
  }

  function _utils_doBorrow(address who, uint256 amount) internal {
    vm.startPrank(who);
    vault.borrow(amount, who, who);
    assertEq(usdc.balanceOf(who), amount);
    vm.stopPrank();
  }

  function _utils_doPayback(address who, uint256 amount) internal {
    vm.startPrank(who);
    uint256 prevDebt = vault.balanceOfDebt(who);
    SafeERC20.safeApprove(IERC20(address(usdc)), address(vault), amount);
    vault.payback(amount, who);
    uint256 debtDiff = prevDebt - amount;
    assertEq(vault.balanceOfDebt(who), debtDiff);
    vm.stopPrank();
  }

  function _utils_doWithdraw(address who, uint256 amount) internal {
    vm.startPrank(who);
    uint256 prevAssets = vault.convertToAssets(vault.balanceOf(who));
    vault.withdraw(amount, who, who);
    uint256 diff = prevAssets - amount;
    assertEq(vault.convertToAssets(vault.balanceOf(who)), diff);
    vm.stopPrank();
  }

  function _utils_checkMaxLTV(uint256 amount, uint256 borrowAmount) internal view returns (bool) {
    uint8 debtDecimals = IERC20Metadata(address(usdc)).decimals();
    uint8 assetDecimals = IERC20Metadata(address(weth)).decimals();
    uint256 maxLtv = 75 * 1e16;

    uint256 price = mockOracle.getPriceOf(address(usdc), address(weth), debtDecimals);
    uint256 maxBorrow = (amount * maxLtv * price) / (1e18 * 10 ** assetDecimals);
    return borrowAmount < maxBorrow;
  }

  function test_depositAndBorrow() public {
    /*vm.assume(weth.totalSupply() > amount && amount > 0 && borrowAmount > 0 && _utils_checkMaxLTV(amount, borrowAmount));*/

    deal(address(weth), alice, DEPOSIT_AMOUNT);

    _utils_doDeposit(alice, DEPOSIT_AMOUNT);
    _utils_doBorrow(alice, BORROW_AMOUNT);
  }
}
