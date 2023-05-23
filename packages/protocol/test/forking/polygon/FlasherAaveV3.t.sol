// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";

import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IV3Pool} from "../../../src/interfaces/aaveV3/IV3Pool.sol";
import {IFlashLoanSimpleReceiver} from "../../../src/interfaces/aaveV3/IFlashLoanSimpleReceiver.sol";
import {WePiggyPolygon} from "../../../src/providers/polygon/WePiggyPolygon.sol";
import {DForcePolygon} from "../../../src/providers/polygon/DForcePolygon.sol";

contract FlasherAaveV3ForkingTests is Routines, ForkingSetup, IFlashLoanSimpleReceiver {
  ILendingProvider public dForce;
  ILendingProvider public wePiggy;

  IFlasher public flasher;

  RebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1000e18;
  uint256 public constant BORROW_AMOUNT = 100e6;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    dForce = new DForcePolygon();
    wePiggy = new WePiggyPolygon();

    flasher = new FlasherAaveV3(0x794a61358D6845594F94dc1DB02A252b5b4814aD);

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = dForce;
    providers[1] = wePiggy;

    deployVault(
      registry[POLYGON_DOMAIN].wmatic, registry[POLYGON_DOMAIN].usdc, "WMATIC", "USDC", providers
    );

    rebalancer = new RebalancerManager(address(chief));
    _grantRoleChief(REBALANCER_ROLE, address(rebalancer));

    bytes memory executionCall =
      abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(this), true);
    _callWithTimelock(address(rebalancer), executionCall);

    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);
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
    deal(address(debtAsset), address(this), flasher.computeFlashloanFee(debtAsset, BORROW_AMOUNT));

    IV3Pool(flasher.getFlashloanSourceAddr(debtAsset)).flashLoanSimple(
      address(this), debtAsset, BORROW_AMOUNT, data, 0
    );

    assertEq(IERC20(debtAsset).balanceOf(address(this)), 0);
  }

  // test rebalance a full position to another provider
  function test_rebalanceWithRebalancer() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 debt = vault.totalDebt();
    uint256 assets = vault.totalAssets();

    rebalancer.rebalanceVault(vault, assets, debt, dForce, wePiggy, flasher, true);

    //issue with rounding
    assertApproxEqAbs(dForce.getDepositBalance(address(vault), vault), 0, DEPOSIT_AMOUNT / 1000);
    assertApproxEqAbs(dForce.getBorrowBalance(address(vault), vault), 0, DEPOSIT_AMOUNT / 1000);

    //issue with rounding
    assertApproxEqAbs(
      wePiggy.getDepositBalance(address(vault), vault), assets, DEPOSIT_AMOUNT / 1000
    );
    assertApproxEqAbs(wePiggy.getBorrowBalance(address(vault), vault), debt, BORROW_AMOUNT / 1000);
  }
}
