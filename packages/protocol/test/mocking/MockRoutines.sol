// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
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

  function do_mintAndMintDebt(uint256 shares, uint256 debtShares, IVault v, address from) internal {
    do_mint(shares, v, from);
    do_mintDebt(debtShares, v, from);
  }

  function do_deposit(uint256 amount, IVault v, address from) internal {
    address asset = v.asset();
    uint256 previousBalance = v.balanceOf(from);

    dealMockERC20(asset, from, amount);

    vm.startPrank(from);
    SafeERC20.safeIncreaseAllowance(IERC20(asset), address(v), amount);
    v.deposit(amount, from);
    vm.stopPrank();

    vm.warp(block.timestamp + 13 seconds);
    vm.roll(block.number + 1);

    uint256 mintedShares = v.balanceOf(from) - previousBalance;
    uint256 assetBalance = v.convertToAssets(mintedShares);

    assertApproxEqAbs(assetBalance, amount, amount / 1000);

    vm.warp(block.timestamp - 13 seconds);
    vm.roll(block.number - 1);
  }

  function do_mint(uint256 shares, IVault v, address from) internal {
    address asset = v.asset();
    uint256 assets = v.previewMint(shares);

    dealMockERC20(asset, from, assets);

    vm.startPrank(from);
    SafeERC20.safeIncreaseAllowance(IERC20(asset), address(v), assets);
    uint256 pulledAssets = v.mint(shares, from);
    vm.stopPrank();

    uint256 mintedShares = v.balanceOf(from);

    assertEq(shares, mintedShares);
    assertEq(pulledAssets, assets);
  }

  function do_withdraw(uint256 amount, IVault v, address from) internal {
    IERC20 asset_ = IERC20(v.asset());
    uint256 prevBal = asset_.balanceOf(from);
    vm.prank(from);
    v.withdraw(amount, from, from);

    uint256 newBal = prevBal + amount;
    assertEq(asset_.balanceOf(from), newBal);
  }

  function do_redeem(uint256 shares, IVault v, address from) internal {
    IERC20 asset_ = IERC20(v.asset());
    uint256 prevBal = asset_.balanceOf(from);
    uint256 prevShares = v.balanceOf(from);

    uint256 assets = v.previewRedeem(shares);
    vm.prank(from);
    v.redeem(shares, from, from);

    uint256 newBal = prevBal + assets;
    uint256 newShares = prevShares - shares;

    assertEq(asset_.balanceOf(from), newBal);
    assertEq(v.balanceOf(from), newShares);
  }

  function do_borrow(uint256 amount, IVault v, address from) internal {
    IERC20 debtAsset_ = IERC20(v.debtAsset());
    uint256 prevBal = debtAsset_.balanceOf(from);

    vm.prank(from);
    v.borrow(amount, from, from);

    uint256 newBal = prevBal + amount;

    assertEq(debtAsset_.balanceOf(from), newBal);
  }

  function do_mintDebt(uint256 shares, IVault v, address from) internal {
    uint256 expectDebt = v.previewMintDebt(shares);

    IERC20 debtAsset_ = IERC20(v.debtAsset());
    uint256 prevBal = debtAsset_.balanceOf(from);

    vm.prank(from);
    v.mintDebt(shares, from, from);

    uint256 newBal = prevBal + expectDebt;

    assertEq(debtAsset_.balanceOf(from), newBal);
    assertEq(v.balanceOfDebtShares(from), shares);
  }

  function do_payback(uint256 amount, IVault v, address from) internal {
    IERC20 debtAsset_ = IERC20(v.debtAsset());
    uint256 bal = debtAsset_.balanceOf(from);

    // Ensure user has additional debt asset to payback accrued interest (+10%).
    dealMockERC20(address(debtAsset_), from, (bal * 110 / 100));
    uint256 prevBal = debtAsset_.balanceOf(from);
    uint256 prevDebtBal = v.balanceOfDebt(from);

    vm.startPrank(from);
    SafeERC20.safeIncreaseAllowance(debtAsset_, address(v), amount);
    v.payback(amount, from);
    vm.stopPrank();

    uint256 newBal = prevBal - amount;
    uint256 newDebtBal = prevDebtBal - amount;

    assertEq(debtAsset_.balanceOf(from), newBal);
    assertEq(v.balanceOfDebt(from), newDebtBal);
  }

  function do_burnDebt(uint256 shares, IVault v, address from) internal {
    IERC20 debtAsset_ = IERC20(v.debtAsset());
    uint256 bal = debtAsset_.balanceOf(from);
    uint256 prevShares = v.balanceOfDebtShares(from);

    uint256 amountToPayback = v.previewBurnDebt(shares);

    uint256 prevBal = debtAsset_.balanceOf(from);
    if (amountToPayback > bal) {
      // Ensure user has enough debt asset to payback accrued interest.
      dealMockERC20(address(debtAsset_), from, (amountToPayback - bal));
      prevBal = debtAsset_.balanceOf(from);
    }

    vm.startPrank(from);
    SafeERC20.safeIncreaseAllowance(debtAsset_, address(v), amountToPayback);
    v.burnDebt(shares, from);
    vm.stopPrank();

    uint256 newBal = prevBal - amountToPayback;
    uint256 newShareBal = prevShares - shares;

    assertEq(debtAsset_.balanceOf(from), newBal);
    assertEq(v.balanceOfDebtShares(from), newShareBal);
  }

  function dealMockERC20(address mockerc20, address to, uint256 amount) internal {
    // MockERC20(mockerc20).mint(to, amount);
    deal(mockerc20, to, amount, true);
  }
}
