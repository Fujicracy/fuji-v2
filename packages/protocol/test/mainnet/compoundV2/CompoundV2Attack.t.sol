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
import {ICToken} from "../../../src/interfaces/compoundV2/ICToken.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {CompoundV2} from "../../../src/providers/mainnet/CompoundV2.sol";
import {IComptroller} from "../../../src/interfaces/compoundV2/IComptroller.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {Chief} from "../../../src/Chief.sol";
import {CoreRoles} from "../../../src/access/CoreRoles.sol";
import {DSTestPlus} from "../../utils/DSTestPlus.sol";

bool constant DEBUG = false;

contract CompoundV2AttackTest is DSTestPlus, CoreRoles {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 mainnetFork;

  IVault public vault;
  CompoundV2 public compoundV2;
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

  function _utils_doDeposit(address who, uint256 amount, IVault v) internal {
    vm.startPrank(who);
    SafeERC20.safeApprove(IERC20(v.asset()), address(v), amount);
    v.deposit(amount, who);
    vm.stopPrank();

    // commented out to allow multiple deposits
    // assertEq(v.balanceOf(who), amount);
  }

  function _utils_doBorrow(address who, uint256 amount, IVault v) internal {
    vm.prank(who);
    v.borrow(amount, who, who);

    assertEq(IERC20(v.debtAsset()).balanceOf(who), amount);
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
    uint256 prevAssets = v.convertToAssets(v.balanceOf(who));
    vm.prank(who);
    v.withdraw(amount, who, who);

    uint256 diff = prevAssets - amount;
    assertEq(v.convertToAssets(v.balanceOf(who)), diff);
  }

  function test_twoDeposits() public {
    // Two deposits are reverting because of overflow in maxMin function
    deal(address(weth), alice, DEPOSIT_AMOUNT);
    deal(address(weth), bob, DEPOSIT_AMOUNT);

    address cTokenAddr = compoundV2.getMapper().getAddressMapping(
      compoundV2.providerName(), 
      address(weth));
    ICToken cToken = ICToken(cTokenAddr);

    _utils_doDeposit(bob, DEPOSIT_AMOUNT, vault);
    _utils_doDeposit(alice, DEPOSIT_AMOUNT, vault);
  }

  function test_depositBorrowAndPayback() public {
    deal(address(weth), alice, DEPOSIT_AMOUNT);
    deal(address(weth), bob, DEPOSIT_AMOUNT);

    address cTokenAddr = compoundV2.getMapper().getAddressMapping(
      compoundV2.providerName(), 
      address(weth));
    ICToken cToken = ICToken(cTokenAddr);

    // bob is the victim
    _utils_doDeposit(bob, DEPOSIT_AMOUNT, vault);


    console.log("---- START (ALICE)");
    console.log("USDC", usdc.balanceOf(alice));
    console.log("WETH", weth.balanceOf(alice));
    console.log("Vault", vault.balanceOf(alice));

    _utils_doDeposit(alice, DEPOSIT_AMOUNT, vault);

    // console.log("---- AFTER DEPOSIT (ALICE)");
    // console.log("USDC", usdc.balanceOf(alice));
    // console.log("WETH", weth.balanceOf(alice));
    // console.log("Deposit shares", vault.balanceOf(alice));
    // console.log("Debt shares", vault.balanceOfDebt(alice));
    // // console.log(vault.totalAssets());
    // // console.log(cToken.balanceOf(address(vault)));

    // _utils_doBorrow(alice, BORROW_AMOUNT, vault);

    // console.log("---- AFTER BORROW");
    // console.log("USDC", usdc.balanceOf(alice));
    // console.log("WETH", weth.balanceOf(alice));
    // console.log("Deposit shares", vault.balanceOf(alice));
    // console.log("Debt shares", vault.balanceOfDebt(alice));

    // console.log(block.number);

    // vm.roll(block.number + 100 days);

    // console.log(block.number);

    // // bob is the victim
    // // _utils_doDeposit(bob, DEPOSIT_AMOUNT/2, vault);

    // _utils_doPayback(alice, BORROW_AMOUNT, vault);

    // console.log("---- AFTER PAYBACK");
    // console.log("USDC", usdc.balanceOf(alice));
    // console.log("WETH", weth.balanceOf(alice));
    // console.log("Deposit shares", vault.balanceOf(alice));
    // console.log("Debt shares", vault.balanceOfDebt(alice));

    // console.log("Max Witdraw:", vault.maxWithdraw(alice));
    // console.log("Max Redeem:", vault.maxRedeem(alice));


    // _utils_doWithdraw(alice, vault.maxWithdraw(alice)-1, vault);

    // console.log("---- AFTER WITHDRAW");
    // console.log("USDC", usdc.balanceOf(alice));
    // console.log("WETH", weth.balanceOf(alice));
    // console.log("Vault", vault.balanceOf(alice));


    // _utils_doWithdraw(bob, vault.maxWithdraw(bob)/2, vault);

    // console.log("---- AFTER WITHDRAW - BOB");
    // console.log("USDC", usdc.balanceOf(bob));
    // console.log("WETH", weth.balanceOf(bob));
    // console.log("Vault", vault.balanceOf(bob));
    
  }
}
