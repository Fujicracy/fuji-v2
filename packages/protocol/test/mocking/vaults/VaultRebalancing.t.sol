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
import {YieldVault} from "../../../src/vaults/yields/YieldVault.sol";
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

contract ThiefProvider is MockProvider {
  function providerName() public pure override returns (string memory) {
    return "ThiefProvider";
  }
}

contract GreedyFlasher is IFlasher {
  using Address for address;

  function initiateFlashloan(
    address, /* asset */
    uint256, /* amount */
    address requestor,
    bytes memory requestorCalldata
  )
    external
    override
  {
    requestor.functionCall(requestorCalldata);
  }

  function getFlashloanSourceAddr(address) external view override returns (address) {
    return address(this);
  }

  function computeFlashloanFee(address, uint256) external pure override returns (uint256 fee) {
    fee = 0;
  }
}

contract MaliciousFlasher is IFlasher {
  using SafeERC20 for IERC20;
  using Address for address;

  function initiateFlashloan(
    address asset,
    uint256 amount,
    address requestor,
    bytes memory /*requestorCalldata*/
  )
    external
    override
  {
    MockERC20(asset).mint(address(this), amount);
    IERC20(asset).safeTransfer(requestor, amount);
    //changes the calldata
    bytes memory requestorCall = abi.encodeWithSelector(
      RebalancerManager.completeRebalance.selector,
      IVault(address(0)),
      0,
      amount,
      address(0),
      address(0),
      this,
      true
    );

    requestor.functionCall(requestorCall);
  }

  function getFlashloanSourceAddr(address) external view override returns (address) {
    return address(this);
  }

  function computeFlashloanFee(address, uint256) external pure override returns (uint256 fee) {
    fee = 0;
  }
}

contract ReentrantFlasher is IFlasher {
  using SafeERC20 for IERC20;
  using Address for address;

  RebalancerManager rebalancer;
  IVault bvault;
  uint256 assets;
  uint256 debt;
  IFlasher flasher;
  ILendingProvider mockProviderA;
  ILendingProvider mockProviderB;

  constructor(
    RebalancerManager rebalancer_,
    IVault bvault_,
    uint256 assets_,
    uint256 debt_,
    IFlasher flasher_,
    ILendingProvider mockProviderA_,
    ILendingProvider mockProviderB_
  ) {
    rebalancer = rebalancer_;
    bvault = bvault_;
    assets = assets_;
    debt = debt_;
    flasher = flasher_;
    mockProviderA = mockProviderA_;
    mockProviderB = mockProviderB_;
  }

  function initiateFlashloan(
    address asset,
    uint256 amount,
    address requestor,
    bytes memory /*requestorCalldata*/
  )
    external
    override
  {
    MockERC20(asset).mint(address(this), amount);
    IERC20(asset).safeTransfer(requestor, amount);

    //this call should fail in the check entry inside the RebalacerManager
    rebalancer.rebalanceVault(bvault, assets, debt, mockProviderA, mockProviderB, flasher, true);
  }

  function getFlashloanSourceAddr(address) external view override returns (address) {
    return address(this);
  }

  function computeFlashloanFee(address, uint256) external pure override returns (uint256 fee) {
    fee = 0;
  }
}

contract VaultRebalancingUnitTests is MockingSetup, MockRoutines {
  BorrowingVault public bvault;
  YieldVault public yvault;

  ILendingProvider public mockProviderA;
  ILendingProvider public mockProviderB;

  MockFlasher public flasher;

  RebalancerManager public rebalancer;

  uint256 DavidPkey = 0xD;
  address DAVID = vm.addr(DavidPkey);

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

    _initializeVault(address(bvault), INITIALIZER, initVaultShares);

    yvault = new YieldVault(
      collateralAsset,
      address(chief),
      "Fuji-V2 tWETH YieldVault",
      "fyvtWETH",
      providers
    );

    _initializeVault(address(yvault), INITIALIZER, initVaultShares);

    flasher = new MockFlasher();
    bytes memory executionCall =
      abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);

    rebalancer = new RebalancerManager(address(chief));
    executionCall =
      abi.encodeWithSelector(chief.grantRole.selector, REBALANCER_ROLE, address(rebalancer));
    _callWithTimelock(address(chief), executionCall);

    executionCall = abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(this), true);
    _callWithTimelock(address(rebalancer), executionCall);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, ALICE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, BOB);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, CHARLIE);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, bvault, DAVID);

    do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, yvault, BOB);
    do_deposit(DEPOSIT_AMOUNT, yvault, CHARLIE);
    do_deposit(DEPOSIT_AMOUNT, yvault, DAVID);
  }

  function _utils_checkRebalanceLtv(
    BorrowingVault v,
    ILendingProvider from,
    ILendingProvider to,
    uint256 rebalanceAssets,
    uint256 rebalanceDebt
  )
    internal
    view
    returns (bool)
  {
    if (rebalanceAssets > v.totalAssets() || rebalanceDebt > v.totalDebt()) {
      return false;
    }
    uint256 assetsAfterRebalanceA = from.getDepositBalance(address(v), v) - rebalanceAssets;
    uint256 debtAfterRebalanceA = from.getBorrowBalance(address(v), v) - rebalanceDebt;

    uint256 assetsAfterRebalanceB = to.getDepositBalance(address(v), v) + rebalanceAssets;
    uint256 debtAfterRebalanceB = to.getBorrowBalance(address(v), v) + rebalanceDebt;

    return _utils_checkMaxLTV(assetsAfterRebalanceA, debtAfterRebalanceA)
      && _utils_checkMaxLTV(assetsAfterRebalanceB, debtAfterRebalanceB);
  }

  function test_assertSetUp() public {
    assertEq(
      mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))),
      4 * DEPOSIT_AMOUNT + initVaultShares
    );
    assertEq(
      mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), 4 * BORROW_AMOUNT
    );
    assertEq(
      mockProviderA.getDepositBalance(address(yvault), IVault(address(yvault))),
      4 * DEPOSIT_AMOUNT + initVaultShares
    );

    // assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), 0);
    // assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), 0);
    // assertEq(mockProviderB.getDepositBalance(address(yvault), IVault(address(yvault))), 0);
  }

  function test_fullRebalancingBorrowingVault() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT + bvault.convertToAssets(initVaultShares); // ALICE, BOB, CHARLIE, DAVID
    uint256 debt = 4 * BORROW_AMOUNT; // ALICE, BOB, CHARLIE, DAVID

    dealMockERC20(debtAsset, address(this), debt);

    IERC20(debtAsset).approve(address(bvault), debt);
    bvault.rebalance(assets, debt, mockProviderA, mockProviderB, 0, true);

    assertEq(mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))), 0);
    assertEq(mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), 0);

    assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), assets);
    assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), debt);
  }

  function test_fullRebalancingYieldVault() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT + initVaultShares; // ALICE, BOB, CHARLIE, DAVID

    yvault.rebalance(assets, 0, mockProviderA, mockProviderB, 0, true);

    assertEq(mockProviderA.getDepositBalance(address(yvault), IVault(address(yvault))), 0);
    assertEq(mockProviderB.getDepositBalance(address(yvault), IVault(address(yvault))), assets);
  }

  function test_partialRebalancingBorrowingVault() public {
    uint256 assets75 = 3 * DEPOSIT_AMOUNT; // ALICE, BOB, CHARLIE
    uint256 debt75 = 3 * BORROW_AMOUNT; // ALICE, BOB, CHARLIE
    uint256 assets25 = DEPOSIT_AMOUNT + initVaultShares; // DAVID
    uint256 debt25 = BORROW_AMOUNT; // DAVID

    dealMockERC20(debtAsset, address(this), debt75);

    IERC20(debtAsset).approve(address(bvault), debt75);
    bvault.rebalance(assets75, debt75, mockProviderA, mockProviderB, 0, true);

    assertEq(mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))), assets25);
    assertEq(mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), debt25);

    assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), assets75);
    assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), debt75);
  }

  //TODO add more test cases with RebalancerManager contract.
  function test_rebalanceBorrowingVaultWithRebalancer() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT + initVaultShares; // ALICE, BOB, CHARLIE, DAVID
    uint256 debt = 4 * BORROW_AMOUNT; // ALICE, BOB, CHARLIE, DAVID

    rebalancer.rebalanceVault(bvault, assets, debt, mockProviderA, mockProviderB, flasher, true);

    assertEq(mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))), 0);
    assertEq(mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), 0);

    assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), assets);
    assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), debt);
  }

  function test_rebalanceYieldVaultWithRebalancer() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT + initVaultShares; // ALICE, BOB, CHARLIE, DAVID

    rebalancer.rebalanceVault(yvault, assets, 0, mockProviderA, mockProviderB, flasher, true);

    assertEq(mockProviderA.getDepositBalance(address(yvault), IVault(address(yvault))), 0);
    assertEq(mockProviderB.getDepositBalance(address(yvault), IVault(address(yvault))), assets);
  }

  //MALICIOUS TESTS

  function test_rebalanceYieldVaultWithRebalancerAndInvalidDebt(uint256 debt) public {
    uint256 assets = 4 * DEPOSIT_AMOUNT + initVaultShares; // ALICE, BOB, CHARLIE, DAVID

    //debt !=0
    rebalancer.rebalanceVault(yvault, assets, debt, mockProviderA, mockProviderB, flasher, true);

    assertEq(mockProviderA.getDepositBalance(address(yvault), IVault(address(yvault))), 0);
    assertEq(mockProviderB.getDepositBalance(address(yvault), IVault(address(yvault))), assets);
  }

  function test_rebalanceYieldVaultWithRebalancerAndInvalidProvider() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT; // ALICE, BOB, CHARLIE, DAVID

    //fake provider to steal funds
    ILendingProvider thiefProvider = new ThiefProvider();

    //rebalance with fake provider should fail
    vm.expectRevert(YieldVault.YieldVault__rebalance_invalidProvider.selector);
    rebalancer.rebalanceVault(yvault, assets, 0, mockProviderA, thiefProvider, flasher, true);
  }

  //TEST FOR ERRORS
  // error RebalancerManager__rebalanceVault_notValidFlasher();
  function test_notValidFlasher() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT; // ALICE, BOB, CHARLIE, DAVID
    MockFlasher invalidFlasher = new MockFlasher();

    //rebalance with invalid flasher should fail
    vm.expectRevert(RebalancerManager.RebalancerManager__rebalanceVault_notValidFlasher.selector);
    rebalancer.rebalanceVault(bvault, assets, 0, mockProviderA, mockProviderB, invalidFlasher, true);
  }

  // error RebalancerManager__checkAssetsAmount_invalidAmount();
  function test_checkAssetsAmountInvalidAmount(uint256 invalidAmount) public {
    uint256 assets = 4 * DEPOSIT_AMOUNT + initVaultShares; // ALICE, BOB, CHARLIE, DAVID
    vm.assume(invalidAmount > assets);

    //rebalance with more amount than available should revert
    vm.expectRevert(RebalancerManager.RebalancerManager__checkAssetsAmount_invalidAmount.selector);

    rebalancer.rebalanceVault(yvault, invalidAmount, 0, mockProviderA, mockProviderB, flasher, true);
  }

  // error RebalancerManager__checkDebtAmount_invalidAmount();
  function test_checkDebtAmountInvalidAmount(uint256 invalidAmount) public {
    uint256 assets = 4 * DEPOSIT_AMOUNT; // ALICE, BOB, CHARLIE, DAVID
    uint256 debt = mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault)));
    vm.assume(invalidAmount > debt); //ALICE, BOB, CHARLIE, DAVID

    // Rebalance with more amount than available should revert
    vm.expectRevert(RebalancerManager.RebalancerManager__checkDebtAmount_invalidAmount.selector);

    rebalancer.rebalanceVault(
      bvault, assets, invalidAmount, mockProviderA, mockProviderB, flasher, true
    );
  }

  // error RebalancerManager__getFlashloan_flashloanFailed();
  function test_flashLoanFailed() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT;
    uint256 debt = 4 * BORROW_AMOUNT;

    //flasher that doesnt give all the amount requested
    IFlasher greedyFlasher = new GreedyFlasher();

    bytes memory executionCall =
      abi.encodeWithSelector(chief.allowFlasher.selector, address(greedyFlasher), true);
    _callWithTimelock(address(chief), executionCall);

    vm.expectRevert(RebalancerManager.RebalancerManager__getFlashloan_flashloanFailed.selector);
    rebalancer.rebalanceVault(
      bvault, assets, debt, mockProviderA, mockProviderB, greedyFlasher, true
    );
  }

  // error RebalancerManager__getFlashloan_notEmptyEntryPoint();
  function test_notEmptyEntryPoint() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT;
    uint256 debt = 4 * BORROW_AMOUNT;

    // IFlasher reentrantHelper = new ReentrantFlasherHelper();
    IFlasher reentrant =
      new ReentrantFlasher(rebalancer, bvault, assets, debt,flasher, mockProviderA, mockProviderB);

    bytes memory executionCall =
      abi.encodeWithSelector(chief.allowFlasher.selector, address(reentrant), true);
    _callWithTimelock(address(chief), executionCall);

    executionCall =
      abi.encodeWithSelector(rebalancer.allowExecutor.selector, address(reentrant), true);
    _callWithTimelock(address(rebalancer), executionCall);

    vm.expectRevert(RebalancerManager.RebalancerManager__getFlashloan_notEmptyEntryPoint.selector);
    rebalancer.rebalanceVault(bvault, assets, debt, mockProviderA, mockProviderB, reentrant, true);
  }

  // error RebalancerManager__completeRebalance_invalidEntryPoint();
  function test_invalidEntryPoint() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT;
    uint256 debt = 4 * BORROW_AMOUNT;

    IFlasher maliciousFlasher = new MaliciousFlasher();

    bytes memory executionCall =
      abi.encodeWithSelector(chief.allowFlasher.selector, address(maliciousFlasher), true);
    _callWithTimelock(address(chief), executionCall);

    vm.expectRevert(
      RebalancerManager.RebalancerManager__completeRebalance_invalidEntryPoint.selector
    );
    rebalancer.rebalanceVault(
      bvault, assets, debt, mockProviderA, mockProviderB, maliciousFlasher, true
    );
  }

  // error RebalancerManager__allowExecutor_noAllowChange();
  function testFail_noAllowChange() public {
    //The TimelockController scheules calls to be made.
    //When we try to allow the same executor twice, the calls reverts in the TimelockController because the call has already been scheduled
    bytes memory executionCall =
      abi.encodeWithSelector(chief.allowFlasher.selector, address(flasher), true);
    _callWithTimelock(address(chief), executionCall);
  }

  // error RebalancerManager__zeroAddress();
  function testFail_zeroAddress() public {
    //The error returned is not the one from RebalancerManager. TimelockController has a verification to see if the underlying call failed,
    //thats the one being returned
    bytes memory executionCall =
      abi.encodeWithSelector(chief.allowFlasher.selector, address(0), true);
    _callWithTimelock(address(chief), executionCall);
  }

  function test_rebalanceAndKeepMaxLtv(uint128 rebalanceAssets, uint128 rebalanceDebt) public {
    vm.assume(
      rebalanceAssets > 0 && rebalanceAssets < bvault.totalAssets() && rebalanceDebt > 0
        && rebalanceDebt < bvault.totalDebt()
    );

    bool rebalanceLtv =
      _utils_checkRebalanceLtv(bvault, mockProviderA, mockProviderB, rebalanceAssets, rebalanceDebt);

    //rebalance
    try rebalancer.rebalanceVault(
      bvault, rebalanceAssets, rebalanceDebt, mockProviderA, mockProviderB, flasher, true
    ) {
      assert(rebalanceLtv);
    } catch {
      assert(!rebalanceLtv);
    }
  }
}
