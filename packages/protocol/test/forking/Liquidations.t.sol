// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../utils/Routines.sol";
import {ForkingSetup2} from "./ForkingSetup2.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {IFlasher} from "../../src/interfaces/IFlasher.sol";
import {ISwapper} from "../../src/interfaces/ISwapper.sol";
import {LiquidationManager} from "../../src/LiquidationManager.sol";

contract LiquidationsTests is Routines, ForkingSetup2 {
  using SafeERC20 for IERC20;

  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);
  uint256 public constant KEEPER_PK = 0xE;
  address public KEEPER = vm.addr(KEEPER_PK);

  LiquidationManager public liquidator;

  function setUp() public {
    setUpFork();

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    setOrDeployBorrowingVaults(false);
    setOrDeployFlasherBalancer(false);
    // TODO: change to false after deploying swappers
    setOrDeployUniswapV2Swapper(true);

    liquidator = new LiquidationManager(address(chief), TREASURY);

    bytes memory data =
      abi.encodeWithSelector(liquidator.allowExecutor.selector, address(KEEPER), true);
    _callWithTimelock(address(liquidator), data);

    data = abi.encodeWithSelector(chief.grantRole.selector, LIQUIDATOR_ROLE, address(liquidator));
    _callWithTimelock(address(chief), data);
  }

  function mock_getPriceOf(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(oracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function test_liq() public {
    uint256 len = allVaults.length;
    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      uint256 depositAmount = allVaults[i].sampleDeposit;
      uint256 borrowAmount = allVaults[i].sampleBorrow;

      do_deposit(depositAmount, IVault(vault), ALICE);

      do_borrow(borrowAmount, IVault(vault), ALICE);
    }

    for (uint256 i; i < len; i++) {
      address vault = allVaults[i].addr;
      uint256 borrowAmount = allVaults[i].sampleBorrow;
      address collateral = allVaults[i].asset;
      address debt = allVaults[i].debtAsset;

      uint256 currentPrice = _getPriceOf(collateral, debt);
      // Simulate 40% price drop
      // enough for user to be liquidated
      // liquidation is still profitable
      uint256 liquidationPrice = (currentPrice * 50) / 100;
      /*uint256 inversePrice = (1e18 / liquidationPrice) * 1e18;*/

      /*mock_getPriceOf(collateral, debt, inversePrice);*/
      mock_getPriceOf(debt, collateral, liquidationPrice);

      //liquidate ALICE
      address[] memory users = new address[](1);
      users[0] = ALICE;
      //do not specify a liquidation close factor
      uint256[] memory liqCloseFactors = new uint256[](users.length);
      liqCloseFactors[0] = 0;

      vm.prank(address(KEEPER));
      liquidator.liquidate(
        users,
        liqCloseFactors,
        IVault(vault),
        borrowAmount,
        IFlasher(flasherBalancer),
        ISwapper(uniswapV2Swapper)
      );
    }
  }
}
