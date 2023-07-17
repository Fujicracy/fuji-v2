// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {MockProvider} from "../../../src/mocks/MockProvider.sol";
import {MockFlasher} from "../../../src/mocks/MockFlasher.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IHarvestable} from "../../../src/interfaces/IHarvestable.sol";
import {Strategy, HarvestManager} from "../../../src/HarvestManager.sol";
import {IHarvestManager} from "../../../src/interfaces/IHarvestManager.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {YieldVault} from "../../../src/vaults/yields/YieldVault.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {MockSwapper} from "../../../src/mocks/MockSwapper.sol";

contract MockProviderIdA is MockProvider {
  function providerName() public pure override returns (string memory) {
    return "ProviderA";
  }
}

contract MockProviderIdB is MockProvider {
  function providerName() public pure override returns (string memory) {
    return "ProviderB";
  }
}

contract MockProviderRewardsInDebtAsset is ILendingProvider, IHarvestable {
  function providerName() public pure virtual override returns (string memory) {
    return "MockProviderRewardsInDebtAsset";
  }

  function approvedOperator(
    address keyAsset,
    address,
    address
  )
    external
    pure
    override
    returns (address operator)
  {
    operator = keyAsset;
  }

  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.makeDeposit(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.debtAsset());
    try merc20.mintDebt(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.withdrawDeposit(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.debtAsset());
    try merc20.burnDebt(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  function getDepositRateFor(IVault) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  function getBorrowRateFor(IVault) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  function getDepositBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(vault.asset()).balanceOfDeposit(user, providerName());
  }

  function getBorrowBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(vault.debtAsset()).balanceOfDebt(user, providerName());
  }

  function harvest(bytes memory data)
    external
    returns (address[] memory tokens, uint256[] memory amounts)
  {
    IVault vault = abi.decode(data, (IVault));
    MockERC20 merc20 = MockERC20(BorrowingVault(payable(address(vault))).debtAsset());
    try merc20.mintRewards(address(vault), 1e18, providerName()) returns (bool /* result */ ) {
      return previewHarvest(vault);
    } catch {}
  }

  function previewHarvest(IVault vault)
    public
    view
    returns (address[] memory tokens, uint256[] memory amounts)
  {
    tokens = new address[](1);
    tokens[0] = BorrowingVault(payable(address(vault))).debtAsset();
    amounts = new uint256[](1);
    amounts[0] = 1e18;
  }
}

contract VaultHarvestUnitTests is MockingSetup, MockRoutines {
  BorrowingVault public bvault;
  BorrowingVault public bvault2;
  YieldVault public yvault;

  ILendingProvider public mockProviderA;
  ILendingProvider public mockProviderB;
  ILendingProvider public mockProviderRewardsInDebtAsset;

  uint256 DavidPkey = 0xD;
  address DAVID = vm.addr(DavidPkey);
  IHarvestManager harvestManager;

  ISwapper swapper;

  uint256 HarvesterPkey = 0xABCD123;
  address HARVESTER = vm.addr(HarvesterPkey);
  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 1000e18;

  function setUp() public {
    vm.label(DAVID, "david");

    mockProviderA = new MockProviderIdA();
    mockProviderB = new MockProviderIdB();
    mockProviderRewardsInDebtAsset = new MockProviderRewardsInDebtAsset();

    vm.label(address(mockProviderA), "ProviderA");
    vm.label(address(mockProviderB), "ProviderB");
    vm.label(address(mockProviderRewardsInDebtAsset), "MockProviderRewardsInDebtAsset");

    ILendingProvider[] memory providers = new ILendingProvider[](3);
    providers[0] = mockProviderA;
    providers[1] = mockProviderB;
    providers[2] = mockProviderRewardsInDebtAsset;

    bvault = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(oracle),
      address(chief),
      "Fuji-V2 tWETH-tDAI BorrowingVault",
      "fbvtWETHtDAI",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO
    );

    providers[0] = mockProviderRewardsInDebtAsset;
    providers[1] = mockProviderB;
    providers[2] = mockProviderA;

    bvault2 = new BorrowingVault(
      collateralAsset,
      debtAsset,
      address(oracle),
      address(chief),
      "Fuji-V2 tWETH-tDAI BorrowingVault",
      "fbvtWETHtDAI",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO
    );

    _initializeVault(address(bvault), INITIALIZER, initVaultShares);
    _initializeVault(address(bvault2), INITIALIZER, initVaultShares);

    yvault = new YieldVault(
      collateralAsset,
      address(chief),
      "Fuji-V2 tWETH YieldVault",
      "fyvtWETH",
      providers
    );

    _initializeVault(address(yvault), INITIALIZER, initVaultShares);

    harvestManager = new HarvestManager(address(chief), TREASURY);
    _grantRoleChief(HARVESTER_ROLE, address(harvestManager));

    bytes memory executionCall =
      abi.encodeWithSelector(harvestManager.allowExecutor.selector, HARVESTER, true);
    _callWithTimelock(address(harvestManager), executionCall);

    swapper = new MockSwapper(oracle);
    executionCall = abi.encodeWithSelector(chief.allowSwapper.selector, address(swapper), true);
    _callWithTimelock(address(chief), executionCall);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, ALICE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, BOB);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, CHARLIE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, DAVID);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault2, ALICE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault2, BOB);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault2, CHARLIE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault2, DAVID);

    do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, yvault, BOB);
    do_deposit(DEPOSIT_AMOUNT, yvault, CHARLIE);
    do_deposit(DEPOSIT_AMOUNT, yvault, DAVID);
  }

  function test_harvestWithStrategy1() public {
    uint256 balanceBefore = mockProviderA.getDepositBalance(address(bvault), bvault);

    bytes memory data = abi.encode(bvault);
    vm.startPrank(HARVESTER);
    harvestManager.harvest(
      bvault, Strategy.ConvertToCollateral, IHarvestable(address(mockProviderA)), swapper, data
    );
    vm.stopPrank();

    uint256 expectedRewards = 1e18;
    assertEq(
      mockProviderA.getDepositBalance(address(bvault), bvault) - balanceBefore, expectedRewards
    );
  }

  function test_harvestWithStrategy1AndSwap() public {
    uint256 balanceBefore =
      mockProviderRewardsInDebtAsset.getDepositBalance(address(bvault2), bvault2);

    bytes memory data = abi.encode(bvault2);
    vm.startPrank(HARVESTER);
    harvestManager.harvest(
      bvault2,
      Strategy.ConvertToCollateral,
      IHarvestable(address(mockProviderRewardsInDebtAsset)),
      swapper,
      data
    );
    vm.stopPrank();

    uint256 expectedRewardsInDebtAsset = 1e18; //in debtAsset
    uint256 expectedRewards = expectedRewardsInDebtAsset
      * oracle.getPriceOf(collateralAsset, debtAsset, assetDecimals) / (10 ** debtDecimals); //in collateralAsset

    uint256 rewardsInVault =
      mockProviderRewardsInDebtAsset.getDepositBalance(address(bvault2), bvault2) - balanceBefore;

    assertEq(rewardsInVault, expectedRewards);
  }
}
