// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../../forking/ForkingSetup.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {SimpleRouter} from "../../../src/routers/SimpleRouter.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";

contract VaultRebalancingForkingTest is Routines, ForkingSetup {
  ILendingProvider public aaveV2;
  ILendingProvider public aaveV3;
  IRouter public router;
  IFlasher public flasher;

  RebalancerManager rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork(POLYGON_DOMAIN);

    aaveV2 = new AaveV2Polygon();
    aaveV3 = new AaveV3Polygon();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = aaveV2;
    providers[1] = aaveV3;

    deploy(providers);

    address aaveV3Pool = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    vm.label(aaveV3Pool, "AaveV3Pool");

    router = new SimpleRouter(IWETH9(collateralAsset), chief);
    flasher = new FlasherAaveV3(aaveV3Pool);
    rebalancer = new RebalancerManager(address(chief));
    _grantRoleChief(REBALANCER_ROLE, address(rebalancer));

    bytes memory executionCall =
      abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(this), true);
    _callWithTimelock(address(rebalancer), executionCall);

    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);
  }

  function test_fullRebalancing() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, BOB);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 assets = aaveV3.getDepositBalance(address(vault), IVault(vault));
    uint256 debt = aaveV3.getBorrowBalance(address(vault), IVault(vault));

    deal(debtAsset, address(this), debt);

    SafeERC20.safeApprove(IERC20(debtAsset), address(vault), debt);
    vault.rebalance(assets, debt, aaveV3, aaveV2, 0, true);

    assertEq(aaveV3.getDepositBalance(address(vault), IVault(address(vault))), 0);
    assertEq(aaveV3.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    assertEq(aaveV2.getDepositBalance(address(vault), IVault(address(vault))), assets);
    // account for the issue with rounding
    assertApproxEqAbs(aaveV2.getBorrowBalance(address(vault), IVault(address(vault))), debt, 1);
  }

  function test_rebalancingWithRebalancer() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, BOB);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 assets = aaveV3.getDepositBalance(address(vault), IVault(vault));
    uint256 debt = aaveV3.getBorrowBalance(address(vault), IVault(vault));

    uint256 fee = flasher.computeFlashloanFee(debtAsset, debt);

    rebalancer.rebalanceVault(vault, assets, debt, aaveV3, aaveV2, flasher, true);

    assertEq(aaveV3.getDepositBalance(address(vault), IVault(address(vault))), 0);
    assertEq(aaveV3.getBorrowBalance(address(vault), IVault(address(vault))), 0);

    assertEq(aaveV2.getDepositBalance(address(vault), IVault(address(vault))), assets);
    // account for the issue with rounding
    assertApproxEqAbs(
      aaveV2.getBorrowBalance(address(vault), IVault(address(vault))), debt + fee, 1
    );
  }
}
