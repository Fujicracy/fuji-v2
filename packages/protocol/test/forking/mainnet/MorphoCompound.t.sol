// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {MorphoCompound} from "../../../src/providers/mainnet/MorphoCompound.sol";
import {IAddrMapper} from "../../../src/interfaces/IAddrMapper.sol";
import {AddrMapper} from "../../../src/helpers/AddrMapper.sol";

contract MorphoCompoundTest is Routines, ForkingSetup {
  ILendingProvider public morphoCompound;
  IAddrMapper public addrMapper;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    addrMapper = AddrMapper(chief.addrMapper());

    //ex. compound_v2=>usdc=>cusdc
    // addrMapper.setMapping("Compound", WETH, CETH);
    // bytes memory encodedWithSelectorData =
    //   abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", WETH, CETH);
    // _callWithTimelock(encodedWithSelectorData, address(addrMapper));
    //
    // // addrMapper.setMapping("Compound", DAI, CDAI);
    // encodedWithSelectorData =
    //   abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", DAI, CDAI);
    // _callWithTimelock(encodedWithSelectorData, address(addrMapper));
    //
    // // addrMapper.setMapping("Compound", USDC, CUSDC);
    // encodedWithSelectorData =
    //   abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", USDC, CUSDC);
    // _callWithTimelock(encodedWithSelectorData, address(addrMapper));
    //
    // // addrMapper.setMapping("Compound", USDT, CUSDT);
    // encodedWithSelectorData =
    //   abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", USDT, CUSDT);
    // _callWithTimelock(encodedWithSelectorData, address(addrMapper));
    //
    // // addrMapper.setMapping("Compound", WBTC, CWBTC);
    // encodedWithSelectorData =
    //   abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", WBTC, CWBTC);
    // _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    morphoCompound = new MorphoCompound();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = morphoCompound;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(morphoCompound);
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    //wait for block to be mined
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1 minutes);

    uint256 aliceDebt = vault.balanceOfDebt(ALICE);
    do_payback(aliceDebt, vault, ALICE);

    uint256 maxAmount = vault.maxWithdraw(ALICE);
    do_withdraw(maxAmount, vault, ALICE);
  }

  function test_getBalances() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    //wait for block to be mined
    vm.roll(block.number + 1);
    vm.warp(block.timestamp + 1 minutes);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT);
    assertGe(borrowBalance, BORROW_AMOUNT);
  }

  function test_getInterestRates() public {
    uint256 depositRate = morphoCompound.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = morphoCompound.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }
}
