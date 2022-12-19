// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {CompoundV2} from "../../../src/providers/mainnet/CompoundV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";

contract CompoundV2Test is Routines, ForkingSetup {
  ILendingProvider public compoundV2;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    compoundV2 = new CompoundV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(compoundV2);
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);

    uint256 aliceDebt = vault.balanceOfDebt(ALICE);
    do_payback(aliceDebt, vault, ALICE);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);
  }
}
