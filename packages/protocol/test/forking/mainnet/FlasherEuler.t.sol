// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {CompoundV3} from "../../../src/providers/mainnet/CompoundV3.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherEuler} from "../../../src/flashloans/FlasherEuler.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {MockRebalancerManager} from "../../../src/mocks/MockRebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Euler} from "../../../src/providers/mainnet/Euler.sol";
import {MockProviderV0} from "../../../src/mocks/MockProviderV0.sol";

import {IEulerDToken} from "../../../src/interfaces/euler/IEulerDToken.sol";
import {IFlashloan} from "../../../src/interfaces/euler/IFlashloan.sol";
import {IEulerMarkets} from "../../../src/interfaces/euler/IEulerMarkets.sol";

contract FlasherEulerTest is Routines, ForkingSetup, IFlashloan {
  ILendingProvider public providerAave;
  ILendingProvider public providerEuler;

  IFlasher public flasher;

  MockRebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 100;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    providerAave = new AaveV2();
    providerEuler = new Euler();
    // providerEuler = new CompoundV3();

    // providerAave = new MockProviderV0();
    // providerEuler = new MockProviderV0();

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = providerAave;
    providers[1] = providerEuler;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(providerAave);

    rebalancer = new MockRebalancerManager();
    chief.grantRole(REBALANCER_ROLE, address(rebalancer));

    flasher = new FlasherEuler(0x27182842E098f60e3D576794A5bFFb0777E025d3);

    // console.log(IERC20(collateralAsset).balanceOf(ALICE));
    do_depositAndBorrow(DEPOSIT_AMOUNT, 16, vault, ALICE);

    //wait for block to be mined
    // vm.roll(block.number + 1);
    // vm.warp(block.timestamp + 1 minutes);
  }
  //
  // function test_eulerFlashloan() public {
  //   uint256 asset = DEPOSIT_AMOUNT;
  //   uint256 debt = 16;
  //
  //   IEulerDToken dToken = IEulerDToken(
  //     IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3).underlyingToDToken(asset)
  //   );
  //   dToken.flashLoan(amount, abi.encode(asset, amount));
  //
  //   assertEq(providerAave.getDepositBalance(address(vault), IVault(address(vault))), 0);
  //   assertEq(providerAave.getBorrowBalance(address(vault), IVault(address(vault))), 0);
  //
  //   assertEq(providerEuler.getDepositBalance(address(vault), IVault(address(vault))), assets);
  //   assertEq(providerEuler.getBorrowBalance(address(vault), IVault(address(vault))), debt);
  //
  // }

  // function test_rebalanceWithFlasher() public {
  //   uint256 assets = DEPOSIT_AMOUNT;
  //   uint256 debt = 16;
  //
  //   bytes memory requestorCall = abi.encodeWithSelector(
  //     MockRebalancerManager.completeRebalance.selector,
  //     vault,
  //     asset,
  //     debt,
  //     providerAave,
  //     providerEuler,
  //     flasher,
  //     true
  //   );
  //
  //   //maybe requestor is euler main address
  //   flasher.initiateFlashloan(assets, debt, address(this), requestorCall);
  //   assertEq(providerAave.getDepositBalance(address(vault), IVault(address(vault))), 0);
  //   assertEq(providerAave.getBorrowBalance(address(vault), IVault(address(vault))), 0);
  //
  //   assertEq(providerEuler.getDepositBalance(address(vault), IVault(address(vault))), assets);
  //   assertEq(providerEuler.getBorrowBalance(address(vault), IVault(address(vault))), debt);
  // }

  function test_simpleFlashloan() public {
    IEulerDToken dToken = IEulerDToken(
      IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3).underlyingToDToken(debtAsset)
    );
    bytes memory data = abi.encode(0);
    dToken.flashLoan(BORROW_AMOUNT, data);
  }

  function onFlashLoan(bytes memory data) external {
    uint256 assets = DEPOSIT_AMOUNT;
    uint256 debt = BORROW_AMOUNT;

    console.log("initial");
    console.log("balance collateral - ", IERC20(collateralAsset).balanceOf(address(this)));
    console.log("balance debt - ", IERC20(debtAsset).balanceOf(address(this)));

    console.log("@onFlashloan inside test");
    //amount, IVault
    providerAave.payback(BORROW_AMOUNT, vault);
    console.log("after payback provider origin");
    console.log("balance collateral - ", IERC20(collateralAsset).balanceOf(address(this)));
    console.log("balance debt - ", IERC20(debtAsset).balanceOf(address(this)));

    providerAave.withdraw(DEPOSIT_AMOUNT, vault);
    console.log("after withdraw provider origin");
    console.log("balance collateral - ", IERC20(collateralAsset).balanceOf(address(this)));
    console.log("balance debt - ", IERC20(debtAsset).balanceOf(address(this)));

    providerEuler.deposit(DEPOSIT_AMOUNT, vault);
    console.log("after deposit provider destination");
    console.log("balance collateral - ", IERC20(collateralAsset).balanceOf(address(this)));
    console.log("balance debt - ", IERC20(debtAsset).balanceOf(address(this)));

    providerEuler.borrow(BORROW_AMOUNT, vault);
    console.log("after borrow provider destination");
    console.log("balance collateral - ", IERC20(collateralAsset).balanceOf(address(this)));
    console.log("balance debt - ", IERC20(debtAsset).balanceOf(address(this)));

    IERC20(debtAsset).transfer(msg.sender, BORROW_AMOUNT); // repay
    console.log("after repay");
    console.log("balance collateral - ", IERC20(collateralAsset).balanceOf(address(this)));
    console.log("balance debt - ", IERC20(debtAsset).balanceOf(address(this)));

    assertEq(providerAave.getDepositBalance(address(vault), IVault(address(vault))), 0);
    assertEq(providerAave.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    assertEq(
      providerEuler.getDepositBalance(address(vault), IVault(address(vault))), DEPOSIT_AMOUNT
    );
    assertEq(providerEuler.getBorrowBalance(address(vault), IVault(address(vault))), BORROW_AMOUNT);
  }

  //test rebalance a full position to another provider
  // function test_rebalanceWithRebalancer() public {
  //   uint256 assets = DEPOSIT_AMOUNT;
  //   uint256 debt = 16;
  //
  //   rebalancer.rebalanceVault(vault, assets, debt, providerAave, providerEuler, flasher, true);
  //
  //   assertEq(providerAave.getDepositBalance(address(vault), IVault(address(vault))), 0);
  //   assertEq(providerAave.getBorrowBalance(address(vault), IVault(address(vault))), 0);
  //
  //   assertEq(providerEuler.getDepositBalance(address(vault), IVault(address(vault))), assets);
  //   assertEq(providerEuler.getBorrowBalance(address(vault), IVault(address(vault))), debt);
  // }
}
