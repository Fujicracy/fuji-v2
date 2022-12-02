// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {MorphoAaveV2} from "../../../src/providers/mainnet/MorphoAaveV2.sol";
import {IAddrMapper} from "../../../src/interfaces/IAddrMapper.sol";
import {AddrMapper} from "../../../src/helpers/AddrMapper.sol";

contract MorphoAaveV2Test is Routines, ForkingSetup {
  ILendingProvider public morphoAaveV2;
  IAddrMapper public addrMapper;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address public constant AWETH = 0x030bA81f1c18d280636F32af80b9AAd02Cf0854e;

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant ADAI = 0x028171bCA77440897B824Ca71D1c56caC55b68A3;

  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address public constant AUSDC = 0xBcca60bB61934080951369a648Fb03DF4F96263C;

  address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
  address public constant AUSDT = 0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811;

  address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
  address public constant AWBTC = 0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656;

  function setUp() public {
    deploy(MAINNET_DOMAIN);

    addrMapper = AddrMapper(chief.addrMapper());

    //ex. compound_v2=>usdc=>cusdc
    // addrMapper.setMapping("Aave_V2", WETH, AWETH);
    bytes memory encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Aave_V2", WETH, AWETH);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Aave_V2", DAI, ADAI);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Aave_V2", DAI, ADAI);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Aave_V2", USDC, AUSDC);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Aave_V2", USDC, AUSDC);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Aave_V2", USDT, AUSDT);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Aave_V2", USDT, AUSDT);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    // addrMapper.setMapping("Aave_V2", WBTC, AWBTC);
    encodedWithSelectorData =
      abi.encodeWithSelector(addrMapper.setMapping.selector, "Aave_V2", WBTC, AWBTC);
    _callWithTimelock(encodedWithSelectorData, address(addrMapper));

    morphoAaveV2 = new MorphoAaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = morphoAaveV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(morphoAaveV2);
  }

  function test_depositAndBorrow() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_borrow(BORROW_AMOUNT, vault, ALICE);
  }

  function test_paybackAndWithdraw() public {
    deal(address(vault.asset()), ALICE, DEPOSIT_AMOUNT);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

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
    uint256 depositRate = morphoAaveV2.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.

    uint256 borrowRate = morphoAaveV2.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }
}
