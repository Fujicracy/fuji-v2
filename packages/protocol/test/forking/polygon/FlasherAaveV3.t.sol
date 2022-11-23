// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";

import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
// import {CompoundV3Polygon} from "../../../src/providers/polygon/CompoundV3Polygon.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherEuler} from "../../../src/flashloans/FlasherEuler.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {MockRebalancerManager} from "../../../src/mocks/MockRebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Euler} from "../../../src/providers/mainnet/Euler.sol";

import {IEulerDToken} from "../../../src/interfaces/euler/IEulerDToken.sol";

contract FlasherEulerTest is Routines, ForkingSetup {
  ILendingProvider public providerAaveV3;
  ILendingProvider public providerAaveV2;

  IFlasher public flasher;

  MockRebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 10e16;

  function setUp() public {
    deploy(POLYGON_DOMAIN);

    providerAaveV3 = new AaveV3Polygon();
    // providerEuler = new Euler();
    providerAaveV2 = new AaveV2Polygon();

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = providerAaveV3;
    providers[1] = providerAaveV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(providerAaveV3);

    rebalancer = new MockRebalancerManager();
    chief.grantRole(REBALANCER_ROLE, address(rebalancer));

    // flasher = new FlasherEuler(0x27182842E098f60e3D576794A5bFFb0777E025d3);
    flasher = new FlasherAaveV3(0x794a61358D6845594F94dc1DB02A252b5b4814aD);

    // console.log(IERC20(collateralAsset).balanceOf(ALICE));
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    // //wait for block to be mined
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

  // function test_simpleFlashloan() public {
  //   flasher.flashLoan();
  //
  // }

  //test rebalance a full position to another provider
  function test_rebalanceWithRebalancer() public {
    uint256 assets = DEPOSIT_AMOUNT;
    uint256 debt = BORROW_AMOUNT;

    console.log("BEFORE REBALANCE");
    console.log(
      "aavev3 deposit balance - ",
      providerAaveV3.getDepositBalance(address(vault), IVault(address(vault)))
    );
    console.log(
      "aavev3 borrow balance - ",
      providerAaveV3.getBorrowBalance(address(vault), IVault(address(vault)))
    );
    console.log(
      "aavev2 deposit balance - ",
      providerAaveV2.getDepositBalance(address(vault), IVault(address(vault)))
    );
    console.log(
      "aavev2 borrow balance - ",
      providerAaveV2.getBorrowBalance(address(vault), IVault(address(vault)))
    );

    rebalancer.rebalanceVault(vault, assets, debt, providerAaveV3, providerAaveV2, flasher, true);

    console.log("AFTER REBALANCE");
    console.log(
      "aavev3 deposit balance - ",
      providerAaveV3.getDepositBalance(address(vault), IVault(address(vault)))
    );
    console.log(
      "aavev3 borrow balance - ",
      providerAaveV3.getBorrowBalance(address(vault), IVault(address(vault)))
    );
    console.log(
      "aavev2 deposit balance - ",
      providerAaveV2.getDepositBalance(address(vault), IVault(address(vault)))
    );
    console.log(
      "aavev2 borrow balance - ",
      providerAaveV2.getBorrowBalance(address(vault), IVault(address(vault)))
    );

    assertEq(providerAaveV3.getDepositBalance(address(vault), IVault(address(vault))), 0);
    assertEq(providerAaveV3.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    assertEq(providerAaveV2.getDepositBalance(address(vault), IVault(address(vault))), assets);
    assertEq(providerAaveV2.getBorrowBalance(address(vault), IVault(address(vault))), debt);
  }
}
