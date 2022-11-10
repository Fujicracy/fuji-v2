// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {Chief} from "../src/Chief.sol";
import {CoreRoles} from "../src/access/CoreRoles.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVaultFactory} from "../src/vaults/borrowing/BorrowingVaultFactory.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {YieldVaultFactory} from "../src/vaults/yield/YieldVaultFactory.sol";
import {YieldVault} from "../src/vaults/yield/YieldVault.sol";
import {BaseVault} from "../src/abstracts/BaseVault.sol";

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

contract VaultRebalancingUnitTests is DSTestPlus, CoreRoles {
  BorrowingVaultFactory public bVaultFactory;
  BorrowingVault public bvault;

  YieldVaultFactory public yVaultFactory;
  YieldVault public yvault;

  Chief public chief;
  TimelockController public timelock;

  ILendingProvider public mockProviderA;
  ILendingProvider public mockProviderB;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);
  uint256 bobPkey = 0xB;
  address bob = vm.addr(bobPkey);
  uint256 charliePkey = 0xC;
  address charlie = vm.addr(charliePkey);
  uint256 davidPkey = 0xD;
  address david = vm.addr(davidPkey);

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 1000e18;

  // WETH and DAI prices: 2000 DAI/WETH
  uint256 public constant TEST_USD_PER_ETH_PRICE = 2000e18;
  uint256 public constant TEST_ETH_PER_USD_PRICE = 5e14;

  function setUp() public {
    vm.label(alice, "Alice");
    vm.label(bob, "Bob");
    vm.label(charlie, "Charlie");
    vm.label(david, "David");

    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    _utils_setupOracle(address(asset), address(debtAsset));

    mockProviderA = new MockProviderIdA();
    mockProviderB = new MockProviderIdB();
    vm.label(address(mockProviderA), "ProviderA");
    vm.label(address(mockProviderB), "ProviderB");

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    bVaultFactory = new BorrowingVaultFactory(address(chief));
    yVaultFactory = new YieldVaultFactory(address(chief));

    chief.addVaultFactory(address(bVaultFactory));
    chief.addVaultFactory(address(yVaultFactory));

    address bvaultAddr = chief.deployVault(
      address(bVaultFactory), abi.encode(address(asset), address(debtAsset), address(oracle)), "A+"
    );
    bvault = BorrowingVault(payable(bvaultAddr));
    _utils_setupVaultProviders(IVault(bvaultAddr));

    address yvaultAddr = chief.deployVault(address(yVaultFactory), abi.encode(address(asset)), "A+");
    yvault = YieldVault(payable(yvaultAddr));
    _utils_setupVaultProviders(IVault(yvaultAddr));

    _utils_doDepositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(bvaultAddr), alice);
    _utils_doDepositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(bvaultAddr), bob);
    _utils_doDepositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(bvaultAddr), charlie);
    _utils_doDepositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(bvaultAddr), david);

    _utils_doDeposit(DEPOSIT_AMOUNT, IVault(yvaultAddr), alice);
    _utils_doDeposit(DEPOSIT_AMOUNT, IVault(yvaultAddr), bob);
    _utils_doDeposit(DEPOSIT_AMOUNT, IVault(yvaultAddr), charlie);
    _utils_doDeposit(DEPOSIT_AMOUNT, IVault(yvaultAddr), david);
  }

  function _utils_setPrice(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_setupOracle(address asset1, address asset2) internal {
    // WETH and DAI prices: 2000 DAI/WETH
    _utils_setPrice(asset1, asset2, TEST_ETH_PER_USD_PRICE);
    _utils_setPrice(asset2, asset1, TEST_USD_PER_ETH_PRICE);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address applicable roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
  }

  function _utils_callWithTimelock(address vault_, bytes memory sendData) internal {
    timelock.schedule(vault_, 0, sendData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(vault_, 0, sendData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProviders(IVault vault_) internal {
    _utils_setupTestRoles();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = mockProviderA;
    providers[1] = mockProviderB;
    bytes memory sendData = abi.encodeWithSelector(vault_.setProviders.selector, providers);
    _utils_callWithTimelock(address(vault_), sendData);
    vault_.setActiveProvider(mockProviderA);
  }

  function dealMockERC20(MockERC20 mockerc20, address to, uint256 amount) internal {
    mockerc20.mint(to, amount);
  }

  function _utils_doDeposit(uint256 amount, IVault v, address who) internal {
    dealMockERC20(MockERC20(address(asset)), who, amount);
    vm.startPrank(who);
    SafeERC20.safeApprove(asset, address(v), amount);
    v.deposit(amount, who);
    vm.stopPrank();
  }

  function _utils_doDepositAndBorrow(
    uint256 depositAmount,
    uint256 borrowAmount,
    IVault v,
    address who
  )
    internal
  {
    _utils_doDeposit(depositAmount, v, who);
    vm.prank(who);
    v.borrow(borrowAmount, who, who);
  }

  function test_assertSetUp() public {
    assertEq(
      mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))), 4 * DEPOSIT_AMOUNT
    );
    assertEq(
      mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), 4 * BORROW_AMOUNT
    );
    assertEq(
      mockProviderA.getDepositBalance(address(yvault), IVault(address(yvault))), 4 * DEPOSIT_AMOUNT
    );

    assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), 0);
    assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), 0);
    assertEq(mockProviderB.getDepositBalance(address(yvault), IVault(address(yvault))), 0);
  }

  function test_fullRebalancingBorrowingVault() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT; // alice, bob, charlie, david
    uint256 debt = 4 * BORROW_AMOUNT; // alice, bob, charlie, david

    dealMockERC20(MockERC20(address(debtAsset)), address(this), debt);

    SafeERC20.safeApprove(debtAsset, address(bvault), debt);
    bvault.rebalance(assets, debt, mockProviderA, mockProviderB, 0);

    assertEq(mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))), 0);
    assertEq(mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), 0);

    assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), assets);
    assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), debt);
  }

  function test_fullRebalancingYieldVault() public {
    uint256 assets = 4 * DEPOSIT_AMOUNT; // alice, bob, charlie, david

    yvault.rebalance(assets, 0, mockProviderA, mockProviderB, 0);

    assertEq(mockProviderA.getDepositBalance(address(yvault), IVault(address(yvault))), 0);
    assertEq(mockProviderB.getDepositBalance(address(yvault), IVault(address(yvault))), assets);
  }

  function test_partialRebalancingBorrowingVault() public {
    uint256 assets75 = 3 * DEPOSIT_AMOUNT; // alice, bob, charlie
    uint256 debt75 = 3 * BORROW_AMOUNT; // alice, bob, charlie
    uint256 assets25 = DEPOSIT_AMOUNT; // david
    uint256 debt25 = BORROW_AMOUNT; // david

    dealMockERC20(MockERC20(address(debtAsset)), address(this), debt75);

    SafeERC20.safeApprove(debtAsset, address(bvault), debt75);
    bvault.rebalance(assets75, debt75, mockProviderA, mockProviderB, 0);

    assertEq(mockProviderA.getDepositBalance(address(bvault), IVault(address(bvault))), assets25);
    assertEq(mockProviderA.getBorrowBalance(address(bvault), IVault(address(bvault))), debt25);

    assertEq(mockProviderB.getDepositBalance(address(bvault), IVault(address(bvault))), assets75);
    assertEq(mockProviderB.getBorrowBalance(address(bvault), IVault(address(bvault))), debt75);
  }
}
