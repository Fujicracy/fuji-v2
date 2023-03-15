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

contract DenialOfServiceTest is Routines, ForkingSetup {
  using SafeERC20 for IERC20;

  ILendingProvider public aaveV2;

  uint256 public TROUBLEMAKER_PK = 0x1122;
  address public TROUBLEMAKER = vm.addr(TROUBLEMAKER_PK);

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

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

  function test_denialOfService() public {
    // Alice deposits and borrows
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);

    // Troublemaker pays vaults debt
    deal(debtAsset, TROUBLEMAKER, BORROW_AMOUNT * 10);
    vm.startPrank(TROUBLEMAKER);
    IERC20(debtAsset).safeApprove(address(aaveV2pool), BORROW_AMOUNT);
    aaveV2pool.repay(vault.debtAsset(), BORROW_AMOUNT, 2, address(vault));
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), DEPOSIT_AMOUNT);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);

    assertApproxEqAbs(vault.balanceOf(ALICE), 0, 1);
  }
}
