// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherEuler} from "../../../src/flashloans/FlasherEuler.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {MockRebalancerManager} from "../../../src/mocks/MockRebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Euler} from "../../../src/providers/mainnet/Euler.sol";

contract FlasherEulerTest is Routines, ForkingSetup {
  ILendingProvider public providerAave;
  ILendingProvider public providerEuler;

  IFlasher public flasher;

  MockRebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 100e18;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    providerAave = new AaveV2();
    providerEuler = new Euler();

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = providerAave;
    providers[1] = providerEuler;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(providerAave);

    rebalancer = new MockRebalancerManager();
    chief.grantRole(REBALANCER_ROLE, address(rebalancer));

    flasher = new FlasherEuler(0x27182842E098f60e3D576794A5bFFb0777E025d3);

    console.log(IERC20(collateralAsset).balanceOf(ALICE));
    do_depositAndBorrow(DEPOSIT_AMOUNT, 16, vault, ALICE);
  }

  //test rebalance a full position to another provider
  function test_rebalanceBorrowingVaultWithRebalancer() public {
    uint256 assets = DEPOSIT_AMOUNT;
    uint256 debt = 16;

    console.log("@test before rebalance");
    rebalancer.rebalanceVault(vault, assets, debt, providerAave, providerEuler, flasher, true);

    console.log("@test before assertion");
    assertEq(providerAave.getDepositBalance(address(vault), IVault(address(vault))), 0);
    assertEq(providerAave.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    assertEq(providerEuler.getDepositBalance(address(vault), IVault(address(vault))), assets);
    assertEq(providerEuler.getBorrowBalance(address(vault), IVault(address(vault))), debt);
  }
}
