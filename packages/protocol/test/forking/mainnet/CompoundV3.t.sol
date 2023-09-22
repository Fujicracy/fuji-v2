// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {CompoundV3} from "../../../src/providers/mainnet/CompoundV3.sol";
import {ICompoundV3} from "../../../src/interfaces/compoundV3/ICompoundV3.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IHarvestable} from "../../../src/interfaces/IHarvestable.sol";
import {Strategy, HarvestManager} from "../../../src/HarvestManager.sol";
import {IHarvestManager} from "../../../src/interfaces/IHarvestManager.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {MockSwapper} from "../../../src/mocks/MockSwapper.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {YieldVault} from "../../../src/vaults/yields/YieldVault.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Chief} from "../../../src/Chief.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {
  ICompoundV3Rewards, RewardOwed
} from "../../../src/interfaces/compoundV3/ICompoundV3Rewards.sol";
import {UniswapV2Swapper} from "../../../src/swappers/UniswapV2Swapper.sol";
import {IUniswapV2Router01} from "../../../src/interfaces/uniswap/IUniswapV2Router01.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {FujiOracle} from "../../../src/FujiOracle.sol";

contract CompoundV3ForkingTests is Routines, ForkingSetup {
  using Math for uint256;

  ILendingProvider public compoundV3;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  IVault public yieldVault;

  IHarvestManager public harvestManager;
  ISwapper public swapper;

  uint256 HarvesterPkey = 0xABCD123;
  address HARVESTER = vm.addr(HarvesterPkey);
  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    compoundV3 = new CompoundV3();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV3;

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));
    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));

    vault = new BorrowingVault(
            collateralAsset,
            debtAsset,
            address(oracle),
            address(chief),
            'Fuji-V2 WETH-USDC Vault Shares',
            'fv2WETHUSDC',
            providers,
            DEFAULT_MAX_LTV,
            DEFAULT_LIQ_RATIO
        );

    yieldVault = new YieldVault(
      debtAsset, //yield vault with compoundV3 base asset
      address(chief),
      "Fuji-V2 WETH-USDC Yield Vault Shares",
      "fv2USDC",
      providers
    );

    bytes memory executionCall =
      abi.encodeWithSelector(chief.setVaultStatus.selector, address(vault), true);
    _callWithTimelock(address(chief), executionCall);

    executionCall = abi.encodeWithSelector(chief.setVaultStatus.selector, address(yieldVault), true);
    _callWithTimelock(address(chief), executionCall);

    initVaultShares = 10 ether;

    _initializeVault(address(vault), INITIALIZER, initVaultShares);
    _initializeVault(address(yieldVault), INITIALIZER, initVaultShares);

    harvestManager = new HarvestManager(address(chief), TREASURY);
    _grantRoleChief(HARVESTER_ROLE, address(harvestManager));

    executionCall = abi.encodeWithSelector(harvestManager.allowExecutor.selector, HARVESTER, true);
    _callWithTimelock(address(harvestManager), executionCall);

    address uniswapV2Router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(uniswapV2Router));

    executionCall = abi.encodeWithSelector(chief.allowSwapper.selector, address(swapper), true);
    _callWithTimelock(address(chief), executionCall);
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 aliceDebt = vault.balanceOfDebt(ALICE);
    do_payback(aliceDebt, vault, ALICE);

    assertEq(vault.balanceOfDebt(ALICE), 0);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);

    assertGe(IERC20(vault.asset()).balanceOf(ALICE), DEPOSIT_AMOUNT);
  }

  function test_getBalances() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT);
    assertGe(borrowBalance, BORROW_AMOUNT);
  }

  function test_combinedGetBalances() public {
    ILendingProvider aaveV2;
    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = compoundV3;
    providers[1] = aaveV2;
    _setVaultProviders(vault, providers);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    _setActiveProvider(vault, aaveV2);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, BOB);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT * 2);
    assertGe(borrowBalance, BORROW_AMOUNT * 2);
  }

  function test_getInterestRates() public {
    uint256 depositRate = compoundV3.getDepositRateFor(vault);
    console.log("deposit_interest-rate:asset", vault.asset(), depositRate);
    assertEq(depositRate, 0); // Should be zero.

    uint256 borrowRate = compoundV3.getBorrowRateFor(vault);
    console.log("borrow_interest-rate:debtAsset", vault.debtAsset(), borrowRate);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }

  // This test is applicable only for CompoundV3
  function testFail_getInterestRatesWithNoMapping() public {
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV3;

    BorrowingVault v = new BorrowingVault(
      address(0),
      address(0),
      address(0),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO
    );

    compoundV3.getDepositRateFor(v);
  }

  function test_twoDeposits() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
  }

  //TODO after previewHarvest
  // function test_harvest() public {
  //   do_deposit(DEPOSIT_AMOUNT, yieldVault, ALICE);
  //
  //   vm.warp(block.timestamp + 39 seconds);
  //   vm.roll(block.number + 3);
  //
  //   //Check view functions are working as expected
  //   address market = CompoundV3(address(compoundV3)).getMapper().getAddressNestedMapping(
  //     compoundV3.providerName(), debtAsset, address(0)
  //   );
  //   RewardOwed memory rewardOwed = ICompoundV3Rewards(0x1B0e765F6224C21223AeA2af16c1C46E38885a40)
  //     .getRewardOwed(market, address(yieldVault));
  //
  //   (address[] memory tokens, uint256[] memory amounts) =
  //     IHarvestable(address(compoundV3)).previewHarvest(yieldVault);
  //
  //   //compoundV3 will only return one token as reward
  //   assertEq(rewardOwed.token, tokens[0]);
  //   assertEq(rewardOwed.owed, amounts[0]);
  //   console.log("Reward Token: ", rewardOwed.token);
  //   console.log("Reward Amount: ", rewardOwed.owed);
  // }

  function test_harvestWithStrategy1AndSwap() public {
    uint256 protocolFee = harvestManager.protocolFee();
    uint8 assetDecimals = yieldVault.decimals();
    uint8 compDecimals = 18;
    do_deposit(DEPOSIT_AMOUNT, yieldVault, ALICE);

    vm.warp(block.timestamp + (13 * 1 seconds));
    vm.roll(block.number + 1);

    uint256 balanceBefore = compoundV3.getDepositBalance(address(yieldVault), vault);

    address market = CompoundV3(address(compoundV3)).getMapper().getAddressNestedMapping(
      compoundV3.providerName(), debtAsset, address(0)
    );
    RewardOwed memory rewardOwed = ICompoundV3Rewards(0x1B0e765F6224C21223AeA2af16c1C46E38885a40)
      .getRewardOwed(market, address(yieldVault));

    bytes memory data = abi.encode(yieldVault);
    vm.startPrank(HARVESTER);
    harvestManager.harvest(
      yieldVault, Strategy.ConvertToCollateral, IHarvestable(address(compoundV3)), swapper, data
    );
    vm.stopPrank();

    uint256 expectedRewardsInCompound = rewardOwed.owed / 10;
    uint256 expectedRewards = expectedRewardsInCompound
      * oracle.getPriceOf(collateralAsset, debtAsset, assetDecimals) / (10 ** compDecimals); //in collateralAsset

    uint256 treasuryAmount = expectedRewards.mulDiv(protocolFee, 1e18);

    uint256 rewardsInyieldVault =
      compoundV3.getDepositBalance(address(yieldVault), vault) - balanceBefore;

    assertEq(rewardsInyieldVault, expectedRewards - treasuryAmount);
    assertEq(IERC20(collateralAsset).balanceOf(TREASURY), treasuryAmount);
  }

  function test_harvestWithStrategy2AndSwap() public {
    uint256 protocolFee = harvestManager.protocolFee();
    uint8 debtDecimals = vault.debtDecimals();
    uint8 compDecimals = 18;

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + (13 * 100000 seconds));
    vm.roll(block.number + 100000);

    uint256 borrowBalanceBefore = compoundV3.getBorrowBalance(address(vault), vault);

    address market = CompoundV3(address(compoundV3)).getMapper().getAddressNestedMapping(
      compoundV3.providerName(), collateralAsset, debtAsset
    );
    RewardOwed memory rewardOwed = ICompoundV3Rewards(0x1B0e765F6224C21223AeA2af16c1C46E38885a40)
      .getRewardOwed(market, address(vault));

    bytes memory data = abi.encode(vault);
    vm.startPrank(HARVESTER);
    harvestManager.harvest(
      vault, Strategy.RepayDebt, IHarvestable(address(compoundV3)), swapper, data
    );
    vm.stopPrank();

    uint256 expectedRewardsInCompound = rewardOwed.owed / 10;
    uint256 expectedRewardsInDebtAsset = expectedRewardsInCompound.mulDiv(
      oracle.getPriceOf(debtAsset, rewardOwed.token, debtDecimals), (10 ** compDecimals)
    ); //in debtAsset

    uint256 treasuryAmount = expectedRewardsInDebtAsset.mulDiv(protocolFee, 1e18);
    uint256 expectedBorrowBalance = 0;
    uint256 expectedTreasuryBalance = 0;

    if (borrowBalanceBefore > expectedRewardsInDebtAsset - treasuryAmount) {
      expectedBorrowBalance = borrowBalanceBefore - (expectedRewardsInDebtAsset - treasuryAmount);
      expectedTreasuryBalance = treasuryAmount;
    } else {
      expectedBorrowBalance = 0;
      expectedTreasuryBalance = expectedRewardsInDebtAsset - borrowBalanceBefore;
    }

    //assert debt in vault
    assertApproxEqAbs(
      compoundV3.getBorrowBalance(address(vault), vault),
      expectedBorrowBalance,
      expectedBorrowBalance / 1000
    );
    //assert treasury detbAsset balance
    assertGe(
      IERC20(debtAsset).balanceOf(TREASURY), expectedTreasuryBalance, "treasury debtAsset balance"
    );

    // assertEq(
    //   IERC20(rewardOwed.token).balanceOf(TREASURY),
    //   _getAmountOfDebtAssetToComp(IERC20(debtAsset).balanceOf(TREASURY) - expectedTreasuryBalance),
    //   "treasury comp balance"
    // ); //treasury is sweeper in swap so it will get comp from swap
    assertEq(IERC20(rewardOwed.token).balanceOf(address(vault)), 0, "vault comp balance"); //vault claims rewards and sends to harvestmanager
    assertEq(
      IERC20(rewardOwed.token).balanceOf(address(harvestManager)), 0, "harvestManager balance"
    );
  }

  function _getAmountOfDebtAssetToComp(uint256 amountOfDebtAsset) internal view returns (uint256) {
    address comp = 0xc00e94Cb662C3520282E6f5717214004A7f26888;
    return amountOfDebtAsset.mulDiv((1e18), oracle.getPriceOf(debtAsset, comp, 6));
  }
}
