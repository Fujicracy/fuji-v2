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

  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address public constant CETH = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant CDAI = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;

  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address public constant CUSDC = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;

  address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
  address public constant CUSDT = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;

  address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
  address public constant CWBTC = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    addrMapper = AddrMapper(chief.addrMapper());

    //ex. compound_v2=>usdc=>cusdc
    // addrMapper.setMapping("Compound", WETH, CETH);
    bytes memory encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", WETH, CETH);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Compound", DAI, CDAI);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", DAI, CDAI);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Compound", USDC, CUSDC);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", USDC, CUSDC);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Compound", USDT, CUSDT);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", USDT, CUSDT);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Compound", WBTC, CWBTC);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Compound", WBTC, CWBTC);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

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
