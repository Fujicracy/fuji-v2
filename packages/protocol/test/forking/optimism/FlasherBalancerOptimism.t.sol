pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherBalancer} from "../../../src/flashloans/FlasherBalancer.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IBalancerVault} from "../../../src/interfaces/balancer/IBalancerVault.sol";
import {IFlashLoanRecipient} from "../../../src/interfaces/balancer/IFlashLoanRecipient.sol";
import {IronBankOptimism} from "../../../src/providers/optimism/IronBankOptimism.sol";
import {AaveV3Optimism} from "../../../src/providers/optimism/AaveV3Optimism.sol";

contract FlasherBalancerOptimismForkingTest is Routines, ForkingSetup, IFlashLoanRecipient {
  ILendingProvider public ironBank;
  ILendingProvider public aaveV3;

  IFlasher public flasher;

  RebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1000e18;
  uint256 public constant BORROW_AMOUNT = 100e6;

  function setUp() public {
    setUpFork(OPTIMISM_DOMAIN);

    ironBank = new IronBankOptimism();
    aaveV3 = new AaveV3Optimism();

    flasher = new FlasherBalancer(0xBA12222222228d8Ba445958a75a0704d566BF2C8);

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = ironBank;
    providers[1] = aaveV3;

    deploy(providers);

    rebalancer = new RebalancerManager(address(chief));
    _grantRoleChief(REBALANCER_ROLE, address(rebalancer));

    bytes memory executionCall =
      abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(this), true);
    _callWithTimelock(address(rebalancer), executionCall);

    executionCall = abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);
  }

  function receiveFlashLoan(
    IERC20[] memory, /*asset*/
    uint256[] memory, /*amount*/
    uint256[] memory feeAmounts,
    bytes calldata data
  )
    external
  {
    (IERC20[] memory assets, uint256[] memory amounts) = abi.decode(data, (IERC20[], uint256[]));

    assertEq(assets[0].balanceOf(address(this)), amounts[0] + feeAmounts[0]);

    IERC20(assets[0]).transfer(msg.sender, amounts[0]);
  }

  function test_flashloan() public {
    IERC20[] memory tokens = new IERC20[](1);
    tokens[0] = IERC20(debtAsset);
    uint256[] memory amounts = new uint256[](1);
    amounts[0] = BORROW_AMOUNT;

    bytes memory data = abi.encode(tokens, amounts);

    //deal premium
    deal(address(debtAsset), address(this), flasher.computeFlashloanFee(debtAsset, BORROW_AMOUNT));

    IBalancerVault(flasher.getFlashloanSourceAddr(debtAsset)).flashLoan(this, tokens, amounts, data);

    assertEq(IERC20(debtAsset).balanceOf(address(this)), 0);
  }

  // test rebalance a full position to another provider
  function test_rebalanceWithRebalancer() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 debt = vault.totalDebt();
    uint256 assets = vault.totalAssets();

    rebalancer.rebalanceVault(vault, assets, debt, ironBank, aaveV3, flasher, true);

    //issue with rounding
    assertApproxEqAbs(ironBank.getDepositBalance(address(vault), vault), 0, DEPOSIT_AMOUNT / 1000);
    assertApproxEqAbs(ironBank.getBorrowBalance(address(vault), vault), 0, DEPOSIT_AMOUNT / 1000);

    //issue with rounding
    assertApproxEqAbs(
      aaveV3.getDepositBalance(address(vault), vault), assets, DEPOSIT_AMOUNT / 1000
    );
    assertApproxEqAbs(aaveV3.getBorrowBalance(address(vault), vault), debt, BORROW_AMOUNT / 1000);
  }
}
