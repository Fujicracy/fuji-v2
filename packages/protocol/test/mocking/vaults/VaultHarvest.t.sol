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
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {YieldVault} from "../../../src/vaults/yield/YieldVault.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {RebalancerManager} from "../../../src/RebalancerManager.sol";

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

contract VaultHarvestUnitTests is MockingSetup, MockRoutines {
  BorrowingVault public bvault;
  YieldVault public yvault;

  ILendingProvider public mockProviderA;
  ILendingProvider public mockProviderB;

  uint256 DavidPkey = 0xD;
  address DAVID = vm.addr(DavidPkey);

  uint256 HarvesterPkey = 0xABCD123;
  address HARVESTER = vm.addr(HarvesterPkey);

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 1000e18;

  function setUp() public {
    vm.label(DAVID, "david");

    mockProviderA = new MockProviderIdA();
    mockProviderB = new MockProviderIdB();
    vm.label(address(mockProviderA), "ProviderA");
    vm.label(address(mockProviderB), "ProviderB");

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = mockProviderA;
    providers[1] = mockProviderB;

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

    _initalizeVault(address(bvault), INITIALIZER, initVaultShares, initVaultDebtShares);

    yvault = new YieldVault(
      collateralAsset,
      address(chief),
      "Fuji-V2 tWETH YieldVault",
      "fyvtWETH",
      providers
    );

    _initalizeYieldVault(address(yvault), INITIALIZER, initVaultShares);

    bytes memory executionCall =
      abi.encodeWithSelector(chief.grantRole.selector, HARVESTER_ROLE, HARVESTER);
    _callWithTimelock(address(chief), executionCall);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, ALICE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, BOB);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, CHARLIE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, DAVID);

    do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, yvault, BOB);
    do_deposit(DEPOSIT_AMOUNT, yvault, CHARLIE);
    do_deposit(DEPOSIT_AMOUNT, yvault, DAVID);
  }

  function test_simpleHarvest() public {
    bytes memory data = abi.encode(bvault);
    vm.startPrank(HARVESTER);
    bvault.harvest(IVault.Strategy.ConvertToCollateral, mockProviderA, data);
    vm.stopPrank();

    uint256 expectedRewards = 1e18;
    MockERC20 rewardToken = MockERC20(bvault.asset());
    assertEq(rewardToken.balanceOf(address(bvault)), expectedRewards);
  }
}
