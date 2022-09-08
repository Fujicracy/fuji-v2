// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {YieldVault} from "../../src/vaults/yield/YieldVault.sol";
import {BeefyVelodromesETHETHOptimism} from
  "../../src/providers/optimism/BeefyVelodromesETHETHOptimism.sol";
import {IWETH9} from "../../src/helpers/PeripheryPayments.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {DSTestPlus} from "../utils/DSTestPlus.sol";

contract VaultTest is DSTestPlus {
  address alice = address(0xA);
  address bob = address(0xB);

  uint256 optimismFork;

  IVault public vault;
  IWETH9 public weth;

  function setUp() public {
    optimismFork = vm.createSelectFork("optimism");

    vm.label(address(alice), "alice");
    vm.label(address(bob), "bob");
    vm.label(0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9, "UniswapV2Solidly");
    vm.label(0xf92129fE0923d766C2540796d4eA31Ff9FF65522, "BeefyVault");

    weth = IWETH9(0x4200000000000000000000000000000000000006);

    vault = new YieldVault(address(weth), address(0));
    ILendingProvider beefy = new BeefyVelodromesETHETHOptimism();
    vault.setActiveProvider(beefy);
  }

  function test_depositAndWithdraw() public {
    uint256 amount = 0.5 ether;
    deal(address(weth), alice, amount);

    vm.startPrank(alice);

    SafeERC20.safeApprove(IERC20(address(weth)), address(vault), amount);
    vault.deposit(amount, alice);

    assertEq(vault.balanceOf(alice), amount);
    /*console.log(vault.maxWithdraw(alice));*/
    console.log("totalAssets", vault.totalAssets());
    vault.withdraw(vault.maxWithdraw(alice), alice, alice);
    assertEq(vault.balanceOf(alice), 0); /*assertEq(IERC20(address(weth)).balanceOf(alice), amount);*/
  }
}
