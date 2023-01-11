// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {BeefyVelodromesETHETH} from "../../../src/providers/optimism/BeefyVelodromesETHETH.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {YieldVault} from "../../../src/vaults/yield/YieldVault.sol";

contract BeefyVelodromesETHETHForkingTest is Routines, ForkingSetup {
  ILendingProvider public compoundV3;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;

  function setUp() public {
    ILendingProvider beefy = new BeefyVelodromesETHETH();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = beefy;

    deploy(OPTIMISM_DOMAIN, providers);

    vm.label(0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9, "UniswapV2Solidly");
    vm.label(0xf92129fE0923d766C2540796d4eA31Ff9FF65522, "BeefyVault");

    vault =
    new YieldVault(collateralAsset, address(chief), "Fuji-V2 WETH YieldVault Shares", "fyvWETH", providers);

    // _setVaultProviders(vault, providers);
    // vault.setActiveProvider(beefy);
  }

  function test_depositAndWithdraw() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_withdraw(vault.maxWithdraw(ALICE), vault, ALICE);
  }
}
