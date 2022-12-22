// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ForkingSetup} from "../forking/ForkingSetup.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {AaveV2} from "../../src/providers/mainnet/AaveV2.sol";
import {SimpleRouter} from "../../src/routers/SimpleRouter.sol";
import {IRouter} from "../../src/interfaces/IRouter.sol";
import {Routines} from "../utils/Routines.sol";
import {IWETH9} from "../../src/abstracts/WETH9.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {LibSigUtils} from "../../src/libraries/LibSigUtils.sol";

contract AttackApprovals is ForkingSetup, Routines {
  address attacker;

  ILendingProvider public aaveV2;
  IRouter public simpleRouter;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    DEPOSIT_AMOUNT = 1 ether;
    BORROW_AMOUNT = 200e18;

    vm.label(CHARLIE, "attacker");
    attacker = CHARLIE;

    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(aaveV2);

    simpleRouter = new SimpleRouter(IWETH9(collateralAsset), chief);
  }

  function test_PermitAttack() public {
    deal(collateralAsset, ALICE, DEPOSIT_AMOUNT);
    vm.prank(ALICE);
    IERC20(collateralAsset).approve(address(simpleRouter), DEPOSIT_AMOUNT);

    // Attacker "somehow" gets hold of this signed message and calls simpleRouter.
    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.Deposit;
    // attacker sets themself as `receiver`.
    args[0] = abi.encode(address(vault), DEPOSIT_AMOUNT, attacker, ALICE);

    vm.expectRevert();
    vm.prank(attacker);
    simpleRouter.xBundle(actions, args);

    // Assert attacker received no funds.
    assertEq(IERC20(debtAsset).balanceOf(attacker), 0);
  }
}
