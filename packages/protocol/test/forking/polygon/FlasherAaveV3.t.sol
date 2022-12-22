// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";

import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IV3Pool} from "../../../src/interfaces/aaveV3/IV3Pool.sol";
import {IFlashLoanSimpleReceiver} from "../../../src/interfaces/aaveV3/IFlashLoanSimpleReceiver.sol";

contract FlasherAaveV3ForkingTest is Routines, ForkingSetup, IFlashLoanSimpleReceiver {
  ILendingProvider public providerAaveV3;
  ILendingProvider public providerAaveV2;

  IFlasher public flasher;

  RebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    deploy(POLYGON_DOMAIN);

    providerAaveV3 = new AaveV3Polygon();
    providerAaveV2 = new AaveV2Polygon();

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = providerAaveV3;
    providers[1] = providerAaveV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(providerAaveV3);

    rebalancer = new RebalancerManager(address(chief));
    _grantRoleChief(REBALANCER_ROLE, address(rebalancer));

    bytes memory executionCall =
      abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(this), true);
    _callWithTimelock(address(rebalancer), executionCall);

    flasher = new FlasherAaveV3(0x794a61358D6845594F94dc1DB02A252b5b4814aD);
    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);
  }

  function executeOperation(
    address, /*asset*/
    uint256, /*amount*/
    uint256 premium,
    address, /*initiator*/
    bytes calldata data
  )
    external
    override
    returns (bool success)
  {
    (address debtAsset_, uint256 amount_) = abi.decode(data, (address, uint256));

    assertEq(IERC20(debtAsset_).balanceOf(address(this)), amount_ + premium);

    IERC20(debtAsset_).approve(msg.sender, amount_ + premium);
    success = true;
  }

  function test_flashloan() public {
    bytes memory data = abi.encode(debtAsset, BORROW_AMOUNT);

    //deal premium
    deal(address(debtAsset), address(this), 1);

    IV3Pool(flasher.getFlashloanSourceAddr(debtAsset)).flashLoanSimple(
      address(this), debtAsset, BORROW_AMOUNT, data, 0
    );

    assertEq(IERC20(debtAsset).balanceOf(address(this)), 0);
  }

  // test rebalance a full position to another provider
  function test_rebalanceWithRebalancer() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    //deal premium 0.05%
    uint256 debt = providerAaveV3.getBorrowBalance(address(vault), IVault(vault));
    deal(address(debtAsset), address(flasher), flasher.computeFlashloanFee(debtAsset, debt));

    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1 minutes);

    uint256 assets = DEPOSIT_AMOUNT;
    debt = BORROW_AMOUNT;

    rebalancer.rebalanceVault(vault, assets, debt, providerAaveV3, providerAaveV2, flasher, true);

    //issue with rounding
    assertApproxEqAbs(
      providerAaveV3.getDepositBalance(address(vault), IVault(address(vault))),
      0,
      DEPOSIT_AMOUNT / 100
    );
    assertEq(providerAaveV3.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    //issue with rounding
    assertApproxEqAbs(
      providerAaveV2.getDepositBalance(address(vault), IVault(address(vault))),
      assets,
      DEPOSIT_AMOUNT / 100
    );
    assertApproxEqAbs(
      providerAaveV2.getBorrowBalance(address(vault), IVault(address(vault))),
      debt,
      BORROW_AMOUNT / 100
    );
  }
}
