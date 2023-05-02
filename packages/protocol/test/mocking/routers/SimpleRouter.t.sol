// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

import "forge-std/console2.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {BaseRouter} from "../../../src/abstracts/BaseRouter.sol";
import {SimpleRouter} from "../../../src/routers/SimpleRouter.sol";
import {SystemAccessControl} from "../../../src/access/SystemAccessControl.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {MockFlasher} from "../../../src/mocks/MockFlasher.sol";
import {MockProvider} from "../../../src/mocks/MockProvider.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {MockSwapper} from "../../../src/mocks/MockSwapper.sol";
import {Chief} from "../../../src/Chief.sol";
import {CoreRoles} from "../../../src/access/CoreRoles.sol";
import {IVaultPermissions} from "../../../src/interfaces/IVaultPermissions.sol";
import {MockingSetup} from "../MockingSetup.sol";

contract SelfDestructor {
  function attack(address payable receiver) public payable {
    selfdestruct(receiver);
  }
}

contract FakeBorrowingVault is BorrowingVault {
  address private _attacker;

  constructor(
    address asset_,
    address debtAsset_,
    address oracle_,
    address chief_,
    string memory name_,
    string memory symbol_,
    ILendingProvider[] memory providers_,
    uint256 maxLtv_,
    uint256 liqRatio_,
    address attacker_
  )
    BorrowingVault(
      asset_,
      debtAsset_,
      oracle_,
      chief_,
      name_,
      symbol_,
      providers_,
      maxLtv_,
      liqRatio_
    )
  {
    _attacker = attacker_;
  }

  function deposit(uint256 assets, address receiver) public override returns (uint256) {
    receiver;
    SafeERC20.safeTransferFrom(IERC20(asset()), msg.sender, address(this), assets);
    SafeERC20.safeTransfer(IERC20(asset()), _attacker, assets);
    return 0;
  }
}

contract SimpleRouterUnitTests is MockingSetup, MockRoutines {
  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Withdraw(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Payback(address indexed sender, address indexed owner, uint256 debt, uint256 shares);

  IRouter public simpleRouter;

  MockFlasher public flasher;

  uint256 amount = 2 ether;
  uint256 borrowAmount = 1000e18;

  MockERC20 public debtAsset2;
  BorrowingVault public newVault;

  function setUp() public {
    oracle = new MockOracle();
    flasher = new MockFlasher();

    simpleRouter = new SimpleRouter(IWETH9(collateralAsset), chief);
  }

  function _depositAndBorrow(uint256 deposit, uint256 debt, IVault vault_) internal {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    bytes[] memory args = new bytes[](3);

    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    args[0] = abi.encode(address(vault_), deposit, ALICE, ALICE);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(address(vault_), ALICE, ALICE, debt);
    args[2] = abi.encode(address(vault_), debt, ALICE, ALICE);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, debt, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault_));

    // Replace permit action arguments, now with the signature values.
    args[1] = abi.encode(address(vault_), ALICE, ALICE, debt, deadline, v, r, s);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, deposit, deposit);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, debt, debt);

    _dealMockERC20(vault_.asset(), ALICE, deposit);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(vault_.asset()), address(simpleRouter), deposit);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();
  }

  function test_depositAndBorrow() public {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(address(vault), ALICE, ALICE, borrowAmount);
    args[2] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, borrowAmount, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[1] = abi.encode(address(vault), ALICE, ALICE, borrowAmount, deadline, v, r, s);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    _dealMockERC20(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(simpleRouter), amount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_paybackAndWithdraw() public {
    _depositAndBorrow(amount, borrowAmount, vault);

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.PermitWithdraw;
    actions[2] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(address(vault), ALICE, ALICE, amount);
    args[2] = abi.encode(address(vault), amount, ALICE, ALICE);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, amount, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[1] = abi.encode(address(vault), ALICE, ALICE, amount, deadline, v, r, s);

    vm.expectEmit(true, true, true, true);
    emit Payback(address(simpleRouter), ALICE, borrowAmount, borrowAmount);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), ALICE, ALICE, amount, amount);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(debtAsset), address(simpleRouter), borrowAmount);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), 0);
  }

  function test_depositETHAndBorrow() public {
    IRouter.Action[] memory actions = new IRouter.Action[](4);
    actions[0] = IRouter.Action.DepositETH;
    actions[1] = IRouter.Action.Deposit;
    actions[2] = IRouter.Action.PermitBorrow;
    actions[3] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](4);
    args[0] = abi.encode(amount);
    args[1] = abi.encode(address(vault), amount, ALICE, address(simpleRouter));
    args[2] = LibSigUtils.getZeroPermitEncodedArgs(address(vault), ALICE, ALICE, borrowAmount);
    args[3] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, borrowAmount, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[2] = abi.encode(address(vault), ALICE, ALICE, borrowAmount, deadline, v, r, s);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    vm.deal(ALICE, amount);

    vm.prank(ALICE);
    simpleRouter.xBundle{value: amount}(actions, args);

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_depositETHAndWithdrawETH() public {
    IRouter.Action[] memory actions = new IRouter.Action[](2);
    actions[0] = IRouter.Action.DepositETH;
    actions[1] = IRouter.Action.Deposit;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(amount);
    args[1] = abi.encode(address(vault), amount, BOB, address(simpleRouter));

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), BOB, amount, amount);

    vm.deal(BOB, amount);

    vm.prank(BOB);
    simpleRouter.xBundle{value: amount}(actions, args);

    assertEq(vault.balanceOf(BOB), amount);

    actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.PermitWithdraw;
    actions[1] = IRouter.Action.Withdraw;
    actions[2] = IRouter.Action.WithdrawETH;

    args = new bytes[](3);
    args[0] =
      LibSigUtils.getZeroPermitEncodedArgs(address(vault), BOB, address(simpleRouter), amount);
    args[1] = abi.encode(address(vault), amount, address(simpleRouter), BOB);
    args[2] = abi.encode(amount, BOB);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      BOB, address(simpleRouter), address(simpleRouter), amount, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, BOB_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[0] = abi.encode(address(vault), BOB, address(simpleRouter), amount, deadline, v, r, s);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), address(simpleRouter), BOB, amount, amount);

    vm.prank(BOB);
    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(BOB), 0);
    assertEq(BOB.balance, amount);
  }

  function test_sweepETH(uint256 amount_) public {
    vm.deal(address(simpleRouter), amount_);

    simpleRouter.sweepETH(BOB);
    assertEq(BOB.balance, amount_);
  }

  function test_tryFoeSweepETH(address foe, uint256 amount_) public {
    vm.assume(foe != address(this));
    vm.deal(address(simpleRouter), amount_);

    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyHouseKeeper_notHouseKeeper.selector
    );

    vm.prank(foe);
    simpleRouter.sweepETH(foe);
  }

  function test_tryFoeSendingETHDirectly(address foe, uint256 amount_) public {
    vm.assume(foe != collateralAsset && amount_ > 0);
    vm.deal(foe, amount_);
    vm.expectRevert(BaseRouter.BaseRouter__receive_senderNotWETH.selector);
    vm.prank(foe);
    payable(address(simpleRouter)).transfer(amount_);
  }

  function test_sweepToken(uint256 amount_) public {
    _dealMockERC20(collateralAsset, address(simpleRouter), amount_);

    simpleRouter.sweepToken(ERC20(collateralAsset), BOB);
    assertEq(ERC20(collateralAsset).balanceOf(BOB), amount_);
  }

  function test_tryFoeSweepToken(address foe) public {
    vm.assume(foe != address(chief));
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyHouseKeeper_notHouseKeeper.selector
    );

    vm.prank(foe);
    simpleRouter.sweepToken(ERC20(collateralAsset), foe);
  }

  function test_depositApprovalAttack() public {
    _dealMockERC20(collateralAsset, ALICE, amount);

    // Alice has approved for some reason the router
    vm.prank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    // attacker sets themself as `receiver`.
    args[0] = abi.encode(address(vault), amount, BOB, ALICE);

    vm.expectRevert();
    vm.prank(BOB);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no shares from attack attempt.
    assertEq(vault.balanceOf(BOB), 0);
  }

  function test_infiniteApprovalwithfakeVault() public {
    address attacker = BOB;

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    FakeBorrowingVault fakeVault = new FakeBorrowingVault(
      collateralAsset,
      debtAsset,
      address(oracle),
      address(chief),
      "Fuji-V2 tWETH-tDAI BorrowingVault",
      "fbvtWETHtDAI",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO,
      attacker
    );

    // Alice has full trust in router and has infinite approved the router
    _dealMockERC20(collateralAsset, ALICE, amount);
    vm.prank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), type(uint256).max);

    // Attacker now attempts using a fake vault address with proper receiver and sender.
    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);
    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(fakeVault), amount, ALICE, ALICE);

    vm.expectRevert();
    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no tokens from attack attempt.
    assertEq(IERC20(collateralAsset).balanceOf(attacker), 0);
  }

  function test_withdrawalApprovalAttack() public {
    _dealMockERC20(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);

    simpleRouter.xBundle(actions, args);
    assertGt(vault.balanceOf(ALICE), 0);

    // Alice approves withdrawal allowance for the router for some reason
    uint256 allowance = vault.previewRedeem(vault.balanceOf(ALICE));
    IVaultPermissions(address(vault)).increaseWithdrawAllowance(
      address(simpleRouter), address(simpleRouter), allowance
    );
    vm.stopPrank();

    // attacker front-runs and calls withdraw
    // using Alice `withdrawAllowance` and attempts to deposits,
    // with themselves as receiver
    IRouter.Action[] memory attackerActions = new IRouter.Action[](2);
    bytes[] memory attackerArgs = new bytes[](2);

    attackerActions[0] = IRouter.Action.Withdraw;
    attackerArgs[0] = abi.encode(address(vault), amount, address(simpleRouter), ALICE);

    attackerActions[1] = IRouter.Action.Deposit;
    attackerArgs[1] = abi.encode(address(vault), amount, BOB, address(simpleRouter));

    vm.expectRevert(BaseRouter.BaseRouter__bundleInternal_notBeneficiary.selector);
    vm.prank(BOB);
    simpleRouter.xBundle(attackerActions, attackerArgs);

    // Assert attacker received no shares from attack attempt.
    assertEq(vault.balanceOf(BOB), 0);
  }

  function test_withdrawalWithPermitAttack() public {
    _dealMockERC20(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertGt(vault.balanceOf(ALICE), 0);

    // Arbitrary hash here, only for testing purposes.
    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1, 2, 3));

    // Alice signs a permit withdrawal for the router for some reason
    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE,
      address(simpleRouter),
      address(simpleRouter),
      amount,
      0,
      address(vault),
      pretendedActionArgsHash
    );
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    // attacker front-runs get hold of signed permit
    // and bundles PermitWithdraw-WithdrawETH
    IRouter.Action[] memory attackerActions = new IRouter.Action[](3);
    bytes[] memory attackerArgs = new bytes[](3);

    attackerActions[0] = IRouter.Action.PermitWithdraw;
    attackerArgs[0] =
      abi.encode(address(vault), ALICE, address(simpleRouter), amount, deadline, v, r, s);

    attackerActions[1] = IRouter.Action.Withdraw;
    attackerArgs[1] = abi.encode(address(vault), amount, address(simpleRouter), ALICE);

    attackerActions[2] = IRouter.Action.WithdrawETH;
    attackerArgs[2] = abi.encode(address(vault), amount, BOB);

    vm.expectRevert();
    vm.prank(BOB);
    simpleRouter.xBundle(attackerActions, attackerArgs);

    // Assert attacker received ETH balance from attack attempt.
    assertEq(BOB.balance, 0);
  }

  function test_borrowWithPermitAttack() public {
    // Create an inverted "asset-debtAsset" vault.
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    newVault = new BorrowingVault(
      debtAsset, // Debt asset as collateral
      collateralAsset, // Collateral asset as debt
      address(oracle),
      address(chief),
      "Fuji-V2 DAI Vault Shares",
      "fv2DAI",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO
    );
    bytes memory data =
      abi.encodeWithSelector(chief.setVaultStatus.selector, address(newVault), true);
    _callWithTimelock(address(chief), data);

    _dealMockERC20(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);

    simpleRouter.xBundle(actions, args);
    vm.stopPrank();

    assertGt(vault.balanceOf(ALICE), 0);

    // Arbitrary hash here, only for testing purposes.
    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1, 2, 3));

    // Alice signs a permit borrow for the router for some reason
    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE,
      address(simpleRouter),
      address(simpleRouter),
      borrowAmount,
      0,
      address(vault),
      pretendedActionArgsHash
    );
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Attacker front-runs get hold of signed permit
    // and bundles PermitBorrow-Borrow-Deposit-in-newVault
    IRouter.Action[] memory attackerActions = new IRouter.Action[](3);
    bytes[] memory attackerArgs = new bytes[](3);

    attackerActions[0] = IRouter.Action.PermitBorrow;
    attackerArgs[0] =
      abi.encode(address(vault), ALICE, address(simpleRouter), borrowAmount, deadline, v, r, s);

    attackerActions[1] = IRouter.Action.Borrow;
    attackerArgs[1] = abi.encode(address(vault), borrowAmount, address(simpleRouter), ALICE);

    attackerActions[2] = IRouter.Action.Deposit;
    attackerArgs[2] = abi.encode(address(newVault), borrowAmount, BOB, address(simpleRouter));

    vm.expectRevert();
    vm.prank(BOB);
    simpleRouter.xBundle(attackerActions, attackerArgs);

    // Assert attacker received no balance from attack attempt.
    assertEq(newVault.balanceOf(BOB), 0);
  }

  function test_depositStuckFundsExploit() public {
    // Funds are stuck at the router.
    _dealMockERC20(collateralAsset, address(simpleRouter), amount);

    // attacker attempts to deposit the stuck funds to themselves.
    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(address(vault), amount, ALICE, address(simpleRouter));

    vm.expectRevert(BaseRouter.BaseRouter__bundleInternal_noBalanceChange.selector);
    vm.prank(ALICE);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no funds.
    assertEq(IERC20(debtAsset).balanceOf(ALICE), 0);
  }

  function test_routerSelfDestructDOSAttack() public {
    SelfDestructor destroyer = new SelfDestructor();

    vm.deal(address(this), 1 wei);
    destroyer.attack{value: 1 wei}(payable(address(simpleRouter)));

    // Alice should be able to interact with router as normal
    _depositAndBorrow(amount, borrowAmount, vault);

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_attackViaSwapper() public {
    // Setup swapper properly
    MockSwapper swapper = new MockSwapper(oracle);
    bytes memory data = abi.encodeWithSelector(chief.allowSwapper.selector, address(swapper), true);
    _callWithTimelock(address(chief), data);

    // This test WBTC is assumed to be 18 decimals for testing simplicity
    MockERC20 tWBTC = new MockERC20("Test WBTC", "tWBTC");
    vm.label(address(tWBTC), "testWBTC");
    // Chainlink type price in 8 decimals.
    uint256 usdPerWBTCPrice = 30000e8;
    oracle.setUSDPriceOf(collateralAsset, USD_PER_ETH_PRICE); // ensure ETH price persist
    oracle.setUSDPriceOf(address(tWBTC), usdPerWBTCPrice);

    uint256 price = oracle.getPriceOf(address(tWBTC), collateralAsset, 18);
    assertGt(price, 0);

    do_deposit(amount, vault, ALICE);

    // Arbitrary hash here, only for testing purposes.
    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1, 2, 3));

    // Alice signs a permit withdrawal for the router for some reason
    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE,
      address(simpleRouter),
      address(simpleRouter),
      amount,
      0,
      address(vault),
      pretendedActionArgsHash
    );
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    // Attacker front-runs permit and creates attack bundle
    address ATTACKER = BOB;
    IRouter.Action[] memory attackActions = new IRouter.Action[](3);
    bytes[] memory attackArgs = new bytes[](3);

    attackActions[0] = IRouter.Action.PermitWithdraw;
    attackArgs[0] =
      abi.encode(address(vault), ALICE, address(simpleRouter), amount, deadline, v, r, s);
    attackActions[1] = IRouter.Action.Withdraw;
    attackArgs[1] = abi.encode(address(vault), amount, address(simpleRouter), ALICE);
    attackActions[2] = IRouter.Action.Swap;
    attackArgs[2] = abi.encode(
      address(swapper),
      collateralAsset,
      address(tWBTC),
      amount,
      5e16,
      ATTACKER,
      ATTACKER,
      0 // not handling slippage in these tests.
    );

    vm.expectRevert();
    vm.startPrank(ATTACKER);
    simpleRouter.xBundle(attackActions, attackArgs);
    vm.stopPrank();

    assertEq(tWBTC.balanceOf(ATTACKER), 0);
  }
}
