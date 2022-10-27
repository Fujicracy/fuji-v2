// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../src/interfaces/IVault.sol";

contract Routines is Test {
  function do_depositAndBorrow(uint256 depositAmount, uint256 borrowAmount, IVault v, address from)
    internal
  {
    do_deposit(depositAmount, v, from);
    do_borrow(borrowAmount, v, from);
  }

  function do_deposit(uint256 amount, IVault v, address from) internal {
    address asset = v.asset();
    deal(asset, from, amount);

    vm.startPrank(from);
    SafeERC20.safeApprove(IERC20(asset), address(v), amount);
    v.deposit(amount, from);
    vm.stopPrank();

    assertEq(v.balanceOf(from), amount);
  }

  function do_withdraw(uint256 amount, IVault v, address from) internal {
    uint256 prevAssets = v.convertToAssets(v.balanceOf(from));
    vm.prank(from);
    v.withdraw(amount, from, from);

    uint256 diff = prevAssets - amount;
    assertEq(v.convertToAssets(v.balanceOf(from)), diff);
  }

  function do_borrow(uint256 amount, IVault v, address from) internal {
    vm.prank(from);
    v.borrow(amount, from, from);

    assertEq(IERC20(v.debtAsset()).balanceOf(from), amount);
  }

  function do_payback(uint256 amount, IVault v, address from) internal {
    uint256 prevDebt = v.balanceOfDebt(from);

    vm.startPrank(from);
    SafeERC20.safeApprove(IERC20(v.debtAsset()), address(v), amount);
    v.payback(amount, from);
    vm.stopPrank();

    uint256 debtDiff = prevDebt - amount;
    assertEq(v.balanceOfDebt(from), debtDiff);
  }
}
