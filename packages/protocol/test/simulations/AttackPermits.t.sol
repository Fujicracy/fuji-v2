// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../mocking/MockingSetup.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {MockProvider} from "../../src/mocks/MockProvider.sol";
import {SimpleRouter} from "../../src/routers/SimpleRouter.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {Routines} from "../utils/Routines.sol";
import {IWETH9} from "../../src/abstracts/WETH9.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";

contract AttackPermitsUnitTests is MockingSetup, Routines {
  address attacker;

  ILendingProvider public mockProvider;
  IRouter public simpleRouter;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 200e18;

  // These test prices should be inverse of each other.
  uint256 public constant USD_PER_ETH_PRICE = 2000e18;
  uint256 public constant ETH_PER_USD_PRICE = 5e14;

  function setUp() public {
    vm.label(CHARLIE, "attacker");
    attacker = CHARLIE;

    oracle.setUSDPriceOf(collateralAsset, USD_PER_ETH_PRICE);
    oracle.setUSDPriceOf(debtAsset, ETH_PER_USD_PRICE);

    mockProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(mockProvider);

    simpleRouter = new SimpleRouter(IWETH9(collateralAsset), chief);
  }

  function test_permitAttack() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
    // Alice signs a message for `simpleRouter` to borrow 800 tDAI.
    uint256 newBorrowAmount = 800e18;

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), ALICE, newBorrowAmount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Attacker "somehow" gets hold of this signed message and calls simpleRouter.
    IRouter.Action[] memory actions = new IRouter.Action[](2);

    actions[0] = IRouter.Action.PermitBorrow;
    actions[1] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);

    args[0] = abi.encode(address(vault), ALICE, attacker, newBorrowAmount, deadline, v, r, s);

    // attacker sets themself as `receiver`.
    args[1] = abi.encode(address(vault), newBorrowAmount, attacker, ALICE);

    vm.expectRevert();
    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no funds.
    assertEq(IERC20(debtAsset).balanceOf(attacker), 0);
  }

  function test_permitAttackWithReceiver() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
    // Alice signs a message for `simpleRouter` to borrow 800 tDAI and do "something" with
    // funds. Therefore 'receiver` is also `operator`.
    uint256 newBorrowAmount = 800e18;

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), address(simpleRouter), newBorrowAmount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // read the balance of the simpleRouter prior to attack.
    uint256 previousBalance = IERC20(debtAsset).balanceOf(address(simpleRouter));

    // Attacker "somehow" gets hold of this signed message and calls simpleRouter.
    IRouter.Action[] memory actions = new IRouter.Action[](2);

    actions[0] = IRouter.Action.PermitBorrow;
    actions[1] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);

    args[0] =
      abi.encode(address(vault), ALICE, address(simpleRouter), newBorrowAmount, deadline, v, r, s);
    args[1] = abi.encode(address(vault), newBorrowAmount, address(simpleRouter), ALICE);

    // With this call the attacker tries to lock the funds in the simpleRouter contract.
    vm.expectRevert();
    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);

    // read the balance of the simpleRouter after attempted attack.
    uint256 afterBalance = IERC20(debtAsset).balanceOf(address(simpleRouter));

    // no change in balances at simpleRouter
    assertEq(previousBalance, afterBalance);
  }

  // attacker tries to withdraw 0
  function test_permitAttackWithdrawETH_1() public {
    do_deposit(DEPOSIT_AMOUNT, vault, attacker);
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);

    vm.deal(address(collateralAsset), DEPOSIT_AMOUNT); // Add some ETH to WETH and make withdrawing ETH even possible

    // uint256 ATTACKER_AMOUNT = 0;

    LibSigUtils.Permit memory permitAlice = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), address(simpleRouter), DEPOSIT_AMOUNT, 0, address(vault)
    );
    (uint256 deadlineAl, uint8 vAl, bytes32 rAl, bytes32 sAl) =
      _getPermitWithdrawArgs(permitAlice, ALICE_PK, address(vault));

    LibSigUtils.Permit memory permitAttacker = LibSigUtils.buildPermitStruct(
      attacker, address(simpleRouter), address(attacker), DEPOSIT_AMOUNT, 0, address(vault)
    );
    (uint256 deadlineAt, uint8 vAt, bytes32 rAt, bytes32 sAt) =
      _getPermitWithdrawArgs(permitAttacker, CHARLIE_PK, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](5);
    actions[0] = IRouter.Action.PermitWithdraw;
    actions[1] = IRouter.Action.PermitWithdraw;
    actions[2] = IRouter.Action.Withdraw;
    actions[3] = IRouter.Action.Withdraw;
    actions[4] = IRouter.Action.WithdrawETH;

    bytes[] memory args = new bytes[](5);
    args[0] = abi.encode(
      address(vault), ALICE, address(simpleRouter), DEPOSIT_AMOUNT, deadlineAl, vAl, rAl, sAl
    );
    args[1] = abi.encode(
      address(vault),
      address(attacker),
      address(attacker),
      DEPOSIT_AMOUNT,
      deadlineAt,
      vAt,
      rAt,
      sAt
    );
    args[2] = abi.encode(address(vault), DEPOSIT_AMOUNT, address(simpleRouter), ALICE);
    args[3] = abi.encode(address(vault), DEPOSIT_AMOUNT - 1, attacker, attacker);
    args[4] = abi.encode(DEPOSIT_AMOUNT, attacker);

    vm.expectRevert();
    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);
  }

  // attacker tries to withdraw > 0
  function test_permitAttackWithdrawETH_2() public {
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);

    // Attacker prepares
    uint256 ATTACKER_AMOUNT = 1;
    do_deposit(ATTACKER_AMOUNT, vault, attacker);
    LibSigUtils.Permit memory permitAttacker = LibSigUtils.buildPermitStruct(
      attacker, address(simpleRouter), attacker, ATTACKER_AMOUNT, 0, address(vault)
    );
    (uint256 deadline2, uint8 v2, bytes32 r2, bytes32 s2) =
      _getPermitWithdrawArgs(permitAttacker, CHARLIE_PK, address(vault));

    IRouter.Action[] memory actions2 = new IRouter.Action[](1);
    actions2[0] = IRouter.Action.PermitWithdraw;

    bytes[] memory args2 = new bytes[](1);
    args2[0] =
      abi.encode(address(vault), attacker, attacker, ATTACKER_AMOUNT, deadline2, v2, r2, s2);

    vm.prank(attacker);
    simpleRouter.xBundle(actions2, args2);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(simpleRouter), address(simpleRouter), DEPOSIT_AMOUNT, 0, address(vault)
    );
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](4);
    actions[0] = IRouter.Action.PermitWithdraw;
    actions[1] = IRouter.Action.Withdraw;
    actions[2] = IRouter.Action.Withdraw;
    actions[3] = IRouter.Action.WithdrawETH;

    bytes[] memory args = new bytes[](4);
    args[0] =
      abi.encode(address(vault), ALICE, address(simpleRouter), DEPOSIT_AMOUNT, deadline, v, r, s);
    args[1] = abi.encode(address(vault), DEPOSIT_AMOUNT, address(simpleRouter), ALICE);
    args[2] = abi.encode(address(vault), ATTACKER_AMOUNT, attacker, attacker);
    args[3] = abi.encode(DEPOSIT_AMOUNT, attacker);

    vm.expectRevert();
    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);
  }
}
