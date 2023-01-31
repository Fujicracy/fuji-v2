// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {IVault} from "../../src/interfaces/IVault.sol";

contract MockRoutines is Test {
  function do_depositAndBorrow(
    uint256 depositAmount,
    uint256 borrowAmount,
    IVault v,
    address from
  )
    internal
  {
    do_deposit(depositAmount, v, from);
    do_borrow(borrowAmount, v, from);
  }

  function do_deposit(uint256 amount, IVault v, address from) internal {
    address asset = v.asset();
    dealMockERC20(asset, from, amount);

    vm.startPrank(from);
    SafeERC20.safeApprove(IERC20(asset), address(v), amount);
    v.deposit(amount, from);
    vm.stopPrank();

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 mintedShares = v.balanceOf(from);
    uint256 assetBalance = v.convertToAssets(mintedShares);

    assertApproxEqAbs(assetBalance, amount, amount / 1000);

    vm.warp(block.timestamp - 13 seconds);
    vm.roll(block.number - 1);
  }

  function do_withdraw(uint256 amount, IVault v, address from) internal {
    IERC20 asset_ = IERC20(v.asset());
    uint256 prevBalance = asset_.balanceOf(from);
    vm.prank(from);
    v.withdraw(amount, from, from);

    uint256 newBalance = prevBalance + amount;
    assertEq(asset_.balanceOf(from), newBalance);
  }

  function do_borrow(uint256 amount, IVault v, address from) internal {
    vm.prank(from);
    v.borrow(amount, from, from);

    assertEq(IERC20(v.debtAsset()).balanceOf(from), amount);
  }

  function do_payback(uint256 amount, IVault v, address from) internal {
    uint256 prevDebt = v.balanceOfDebt(from);
    address asset = v.debtAsset();
    dealMockERC20(asset, from, prevDebt); // ensure user has accrued interest to payback.

    vm.startPrank(from);
    SafeERC20.safeApprove(IERC20(v.debtAsset()), address(v), amount);
    v.payback(amount, from);
    vm.stopPrank();

    uint256 debtDiff = prevDebt - amount;
    assertEq(v.balanceOfDebt(from), debtDiff);
  }

  function dealMockERC20(address mockerc20, address to, uint256 amount) internal {
    MockERC20(mockerc20).mint(to, amount);
  }
}
