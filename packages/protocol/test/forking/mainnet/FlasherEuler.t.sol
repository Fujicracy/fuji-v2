// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {CompoundV2} from "../../../src/providers/mainnet/CompoundV2.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherEuler} from "../../../src/flashloans/FlasherEuler.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Euler} from "../../../src/providers/mainnet/Euler.sol";
import {IEulerDToken} from "../../../src/interfaces/euler/IEulerDToken.sol";
import {IFlashloan} from "../../../src/interfaces/euler/IFlashloan.sol";
import {IEulerMarkets} from "../../../src/interfaces/euler/IEulerMarkets.sol";

contract FlasherEulerTest is Routines, ForkingSetup, IFlashloan {
  ILendingProvider public providerAave;
  ILendingProvider public providerCompound;

  IFlasher public flasher;

  RebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 100;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    providerAave = new AaveV2();
    providerCompound = new CompoundV2();

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = providerAave;
    providers[1] = providerCompound;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(providerAave);

    rebalancer = new RebalancerManager(address(chief));
    chief.grantRole(REBALANCER_ROLE, address(rebalancer));

    bytes memory executionCall =
      abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(this), true);
    _callWithTimelock(executionCall, address(rebalancer));

    flasher = new FlasherEuler(0x27182842E098f60e3D576794A5bFFb0777E025d3);
    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(executionCall, address(chief));

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
  }

  function onFlashLoan(bytes memory data) external {
    (address debtAsset_, uint256 amount_) = abi.decode(data, (address, uint256));

    assertEq(IERC20(debtAsset_).balanceOf(address(this)), amount_);

    IERC20(debtAsset_).transfer(msg.sender, amount_); // repay
  }

  function test_flashloan() public {
    IEulerDToken dToken = IEulerDToken(
      IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3).underlyingToDToken(debtAsset)
    );
    bytes memory data = abi.encode(debtAsset, BORROW_AMOUNT);
    dToken.flashLoan(BORROW_AMOUNT, data);
    assertEq(IERC20(debtAsset).balanceOf(address(this)), 0);
  }

  // test rebalance a full position to another provider
  function test_rebalanceWithRebalancer() public {
    uint256 assets = DEPOSIT_AMOUNT;
    uint256 debt = BORROW_AMOUNT;

    rebalancer.rebalanceVault(vault, assets, debt, providerAave, providerCompound, flasher, true);

    assertEq(providerAave.getDepositBalance(address(vault), IVault(address(vault))), 0);
    assertEq(providerAave.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    //issue with rounding
    assertApproxEqAbs(
      providerCompound.getDepositBalance(address(vault), IVault(address(vault))),
      assets,
      DEPOSIT_AMOUNT / 100
    );
    assertApproxEqAbs(
      providerCompound.getBorrowBalance(address(vault), IVault(address(vault))),
      debt,
      BORROW_AMOUNT / 100
    );
  }
}
