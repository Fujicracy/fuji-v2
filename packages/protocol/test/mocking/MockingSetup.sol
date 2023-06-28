// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Test} from "forge-std/Test.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {YieldVault} from "../../src/vaults/yields/YieldVault.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {MockProvider} from "../../src/mocks/MockProvider.sol";
import {Chief} from "../../src/Chief.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {IVaultPermissions} from "../../src/interfaces/IVaultPermissions.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";

contract MockingSetup is CoreRoles, Test {
  uint256 public constant ALICE_PK = 0xA;
  address public ALICE = vm.addr(ALICE_PK);
  uint256 public constant BOB_PK = 0xB;
  address public BOB = vm.addr(BOB_PK);
  uint256 public constant CHARLIE_PK = 0xC;
  address public CHARLIE = vm.addr(CHARLIE_PK);

  BorrowingVault public vault;
  Chief public chief;
  TimelockController public timelock;
  ILendingProvider public mockProvider;
  MockOracle public oracle;

  address public collateralAsset;
  address public debtAsset;

  address public INITIALIZER = vm.addr(0x111A13); //arbitrary address

  uint256 initVaultShares;
  uint256 initVaultDebtShares;

  uint256 public constant DEFAULT_MAX_LTV = 75e16; // 75%
  uint256 public constant DEFAULT_LIQ_RATIO = 82.5e16; // 82.5%

  // Chainlink type prices in 8 decimals.
  uint256 public constant USD_PER_ETH_PRICE = 2000e8;
  uint256 public constant USD_PER_DAI_PRICE = 1e8;

  // Decimals for the assets
  uint8 public assetDecimals = 18;
  uint8 public debtDecimals = 18;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");
    vm.label(INITIALIZER, "initializer");

    MockERC20 tWETH = new MockERC20("Test WETH", "tWETH");
    collateralAsset = address(tWETH);
    vm.label(collateralAsset, "testWETH");

    MockERC20 tDAI = new MockERC20("Test DAI", "tDAI");
    debtAsset = address(tDAI);
    vm.label(debtAsset, "testDAI");

    oracle = new MockOracle();
    // WETH and DAI prices: 2000 DAI/WETH
    oracle.setUSDPriceOf(collateralAsset, USD_PER_ETH_PRICE);
    oracle.setUSDPriceOf(debtAsset, USD_PER_DAI_PRICE);

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));

    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));
    _grantRoleChief(HOUSE_KEEPER_ROLE, address(this));

    // Initialize with a default mockProvider
    mockProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    vault = new BorrowingVault(
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

    bytes memory executionCall =
      abi.encodeWithSelector(chief.setVaultStatus.selector, address(vault), true);
    _callWithTimelock(address(chief), executionCall);

    uint256 minAmount = vault.minAmount();
    initVaultShares = 10 * minAmount;
    initVaultDebtShares = minAmount;

    _initalizeVault(address(vault), INITIALIZER, initVaultShares, initVaultDebtShares);
  }

  function _initalizeVault(
    address vault_,
    address initializer,
    uint256 assets,
    uint256 debt
  )
    internal
  {
    BorrowingVault bVault = BorrowingVault(payable(vault_));
    address collatAsset_ = bVault.asset();
    address debtAsset_ = bVault.debtAsset();

    _dealMockERC20(collatAsset_, initializer, assets);
    _dealMockERC20(debtAsset_, initializer, debt);

    vm.startPrank(initializer);
    SafeERC20.safeApprove(IERC20(collatAsset_), vault_, assets);
    SafeERC20.safeApprove(IERC20(debtAsset_), vault_, debt);
    bVault.initializeVaultShares(assets, debt);
    vm.stopPrank();
  }

  function _initalizeYieldVault(address vault_, address initializer, uint256 assets) internal {
    YieldVault yvault = YieldVault(payable(vault_));
    address collatAsset_ = yvault.asset();

    _dealMockERC20(collatAsset_, initializer, assets);

    vm.startPrank(initializer);
    SafeERC20.safeApprove(IERC20(collateralAsset), vault_, assets);
    yvault.initializeVaultShares(assets, 0);
    vm.stopPrank();
  }

  function _dealMockERC20(address mockerc20, address to, uint256 amount) internal {
    // MockERC20(mockerc20).mint(to, amount);
    deal(mockerc20, to, amount, true);
  }

  function _callWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(target, 0, callData, 0x00, 0x00);
    rewind(2 days);
  }

  function _grantRoleChief(bytes32 role, address account) internal {
    bytes memory sendData = abi.encodeWithSelector(chief.grantRole.selector, role, account);
    _callWithTimelock(address(chief), sendData);
  }

  function _setVaultProviders(IVault v, ILendingProvider[] memory providers) internal {
    bytes memory sendData = abi.encodeWithSelector(IVault.setProviders.selector, providers);
    _callWithTimelock(address(v), sendData);
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function _getPermitBorrowArgs(
    LibSigUtils.Permit memory permit,
    uint256 ownerPrivateKey,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 structHash = LibSigUtils.getStructHashBorrow(permit);
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      structHash
    );
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
    deadline = permit.deadline;
  }

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function _getPermitWithdrawArgs(
    LibSigUtils.Permit memory permit,
    uint256 ownerPrivateKey,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      LibSigUtils.getStructHashWithdraw(permit)
    );
    (v, r, s) = vm.sign(ownerPrivateKey, digest);
    deadline = permit.deadline;
  }

  function _utils_checkMaxLTV(uint256 amount, uint256 borrowAmount) internal view returns (bool) {
    uint256 maxLtv = DEFAULT_MAX_LTV;

    uint256 price = oracle.getPriceOf(debtAsset, collateralAsset, debtDecimals);
    uint256 maxBorrow = (amount * maxLtv * price) / (1e18 * 10 ** assetDecimals);
    return borrowAmount < maxBorrow;
  }
}
