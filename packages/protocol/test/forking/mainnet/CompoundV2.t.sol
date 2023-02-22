// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {CompoundV2} from "../../../src/providers/mainnet/CompoundV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import {IComptroller} from "../../../src/interfaces/compoundV2/IComptroller.sol";

contract CompoundV2ForkingTest is Routines, ForkingSetup {
  ILendingProvider public compoundV2;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    compoundV2 = new CompoundV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV2;

    deploy(providers);
  }

  function test_cannot_claim_comp() public {
    IERC20 comp = IERC20(0xc00e94Cb662C3520282E6f5717214004A7f26888);
    IComptroller comptroller = IComptroller(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);

    // ALICE borrow 
    do_deposit(100 ether, vault, ALICE);
    do_borrow(3 * 10**10, vault, ALICE);

    // a lot of time pass
    vm.warp(block.timestamp + 1000);
    vm.roll(block.number + 100);

    // these 2 lines used to trigger the update comp index in comtroller 
    vm.prank(ALICE);
    vault.borrow(BORROW_AMOUNT, ALICE, ALICE);

    // get accrued comp for the vault 
    (bool ok, bytes memory data) = address(comptroller).call(
      abi.encodeWithSignature(
        "compAccrued(address)",
        address(vault)
      )
    );

    // amount of comp is bigger than 0
    uint256 compAccrued = abi.decode(data, (uint256));
    console.log(compAccrued);
    assertGt(compAccrued, 0);

    // there is no function to claim COMP here :((
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 aliceDebt = vault.balanceOfDebt(ALICE);
    do_payback(aliceDebt, vault, ALICE);

    assertEq(vault.balanceOfDebt(ALICE), 0);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);

    assertGe(IERC20(vault.asset()).balanceOf(ALICE), DEPOSIT_AMOUNT);
  }

  function test_twoDeposits() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
  }
}
