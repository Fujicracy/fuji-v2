// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Setup} from "./utils/Setup.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";
import {IVault} from "../src/interfaces/IVault.sol";

interface IMintable {
  function mint(address, uint256) external;
}

contract VaultTestsSuite is Setup {
  function testConfigs() public {
    assertEq(vault.asset(), asset);
    assertEq(vault.debtAsset(), debtAsset);
    assertEq(address(vault.activeProvider()), address(aaveV3));
  }

  function testDepositAndWithdraw() public {
    address userChainA = address(0xA);
    vm.label(address(userChainA), "userChainA");

    /*vm.deal(userChainA, amount);*/
    uint256 amount = 2 ether;
    IMintable(address(weth)).mint(userChainA, amount);
    assertEq(weth.balanceOf(userChainA), amount);

    vm.startPrank(userChainA);

    SafeTransferLib.safeApprove(weth, address(vault), amount);
    vault.deposit(amount, userChainA);

    assertEq(vault.balanceOf(userChainA), amount);
    vault.withdraw(amount, userChainA, userChainA);
    assertEq(vault.balanceOf(userChainA), 0);
    assertEq(weth.balanceOf(userChainA), amount);
  }

  function testDepositAndWithdrawFromRouter() public {
    address userChainA = address(0xA);
    vm.label(address(userChainA), "userChainA");

    /*vm.deal(userChainA, amount);*/
    uint256 amount = 2 ether;
    IMintable(address(weth)).mint(userChainA, amount);
    assertEq(weth.balanceOf(userChainA), amount);

    vm.startPrank(userChainA);

    SafeTransferLib.safeApprove(weth, address(router), type(uint256).max);
    router.depositToVault(IVault(address(vault)), amount);

    assertEq(vault.balanceOf(userChainA), amount);
    router.withdrawFromVault(IVault(address(vault)), amount);
    assertEq(vault.balanceOf(userChainA), 0);
    assertEq(weth.balanceOf(userChainA), amount);
  }

  function testDepositAndBorrowFromRouter() public {
    address userChainA = address(0xA);
    vm.label(address(userChainA), "userChainA");

    uint256 amount = 2 ether;
    uint256 debtAmount = 100000000;

    IMintable(address(weth)).mint(userChainA, amount);
    assertEq(weth.balanceOf(userChainA), amount);

    vm.startPrank(userChainA);

    SafeTransferLib.safeApprove(weth, address(router), type(uint256).max);
    router.depositAndBorrow(IVault(address(vault)), amount, debtAmount);
    assertEq(ERC20(debtAsset).balanceOf(userChainA), debtAmount);
  }
}
