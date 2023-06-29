// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IV2Pool} from "../../../src/interfaces/aaveV2/IV2Pool.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {PausableVault} from "../../../src/abstracts/PausableVault.sol";

contract DenialOfServiceTest is Routines, ForkingSetup {
  using SafeERC20 for IERC20;

  uint256 public constant TREASURY_PK = 0xF;
  address public TREASURY = vm.addr(TREASURY_PK);

  ILendingProvider public aaveV2;

  uint256 public TROUBLEMAKER_PK = 0x1122;
  address public TROUBLEMAKER = vm.addr(TROUBLEMAKER_PK);

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 800 * 1e6;

  IV2Pool public aaveV2pool;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    vm.label(TROUBLEMAKER, "TROUBLEMAKER");

    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = aaveV2;

    deploy(providers);

    aaveV2pool = IV2Pool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
  }

  function test_tryWithdrawWhenFullDebtIsPaybackExternally() public {
    // Alice deposits and borrows
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);

    // Troublemaker pays vaults debt
    deal(debtAsset, TROUBLEMAKER, BORROW_AMOUNT * 10);
    vm.startPrank(TROUBLEMAKER);
    IERC20(debtAsset).safeApprove(address(aaveV2pool), BORROW_AMOUNT);
    aaveV2pool.repay(vault.debtAsset(), BORROW_AMOUNT, 2, address(vault));
    vm.stopPrank();

    console.log("assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT)");
    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);
    console.log("assertEq(vault.balanceOfDebt(ALICE), 0)");
    assertEq(vault.balanceOfDebt(ALICE), 0);

    //Withdraw will fail until debt is corrected and withdraw is unpaused
    uint256 maxAmount = vault.maxRedeem(ALICE);
    vm.prank(ALICE);
    vault.redeem(maxAmount, ALICE, ALICE);
  }

  // function test_correctDebtUnpauseAndWithdraw() public {
  //   uint256 amountCorrected = BORROW_AMOUNT;

  //   do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
  //   do_borrow(BORROW_AMOUNT, vault, ALICE);

  //   // Troublemaker pays vaults debt
  //   deal(debtAsset, TROUBLEMAKER, BORROW_AMOUNT * 10);
  //   vm.startPrank(TROUBLEMAKER);
  //   //TODO check this after rounding issue is fixed
  //   //approve more than needed because of rounding issues
  //   IERC20(debtAsset).safeApprove(address(aaveV2pool), BORROW_AMOUNT + 10);
  //   //pay full amount, sometimes bigger than BORROW_AMOUNT
  //   aaveV2pool.repay(
  //     vault.debtAsset(), aaveV2.getBorrowBalance(address(vault), vault), 2, address(vault)
  //   );
  //   vm.stopPrank();

  //   bytes memory data = abi.encodeWithSelector(BorrowingVault.correctDebt.selector, TREASURY);
  //   _callWithTimelock(address(vault), data);
  //   skip(2 days);

  //   //try to payback and withdraw and check it works
  //   do_payback(BORROW_AMOUNT, vault, ALICE);
  //   do_withdraw(DEPOSIT_AMOUNT, vault, ALICE);

  //   //DEPOSIT_AMOUNT has built up some interest after the call with timelock (lets assume 1%)
  //   assertApproxEqAbs(vault.balanceOf(ALICE), 0, DEPOSIT_AMOUNT / 100);

  //   //check the actual corrected amount is in TREASURY
  //   assertEq(aaveV2.getBorrowBalance(address(vault), vault), 0);
  //   assertEq(IERC20(debtAsset).balanceOf(TREASURY), amountCorrected);
  // }
}
