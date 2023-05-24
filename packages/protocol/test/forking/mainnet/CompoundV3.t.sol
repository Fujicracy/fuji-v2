// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {CompoundV3} from "../../../src/providers/mainnet/CompoundV3.sol";
import {ICompoundV3} from "../../../src/interfaces/compoundV3/ICompoundV3.sol";
import {AaveV2} from "../../../src/providers/mainnet/AaveV2.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Chief} from "../../../src/Chief.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";

contract CompoundV3ForkingTests is Routines, ForkingSetup {
  ILendingProvider public compoundV3;

  uint256 public constant DEPOSIT_AMOUNT = 0.5 ether;
  uint256 public constant BORROW_AMOUNT = 200 * 1e6;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    compoundV3 = new CompoundV3();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV3;

    chief = new Chief(true, true);
    timelock = TimelockController(payable(chief.timelock()));
    // Grant this address all roles.
    _grantRoleChief(REBALANCER_ROLE, address(this));
    _grantRoleChief(LIQUIDATOR_ROLE, address(this));

    vault = new BorrowingVault(
            collateralAsset,
            debtAsset,
            address(oracle),
            address(chief),
            'Fuji-V2 WETH-USDC Vault Shares',
            'fv2WETHUSDC',
            providers,
            DEFAULT_MAX_LTV,
            DEFAULT_LIQ_RATIO
        );

    bytes memory executionCall =
      abi.encodeWithSelector(chief.setVaultStatus.selector, address(vault), true);
    _callWithTimelock(address(chief), executionCall);

    initVaultDebtShares = ICompoundV3(0xc3d688B66703497DAA19211EEdff47f25384cdc3).baseBorrowMin();
    initVaultShares =
      _getMinCollateralAmount(BorrowingVault(payable(address(vault))), initVaultDebtShares);

    _initalizeVault(address(vault), INITIALIZER, initVaultShares, initVaultDebtShares);
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

  function test_getBalances() public {
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT);
    assertGe(borrowBalance, BORROW_AMOUNT);
  }

  function test_combinedGetBalances() public {
    ILendingProvider aaveV2;
    aaveV2 = new AaveV2();
    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = compoundV3;
    providers[1] = aaveV2;
    _setVaultProviders(vault, providers);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);

    _setActiveProvider(vault, aaveV2);
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, BOB);

    uint256 depositBalance = vault.totalAssets();
    uint256 borrowBalance = vault.totalDebt();
    assertGe(depositBalance, DEPOSIT_AMOUNT * 2);
    assertGe(borrowBalance, BORROW_AMOUNT * 2);
  }

  function test_getInterestRates() public {
    uint256 depositRate = compoundV3.getDepositRateFor(vault);
    assertEq(depositRate, 0); // Should be zero.

    uint256 borrowRate = compoundV3.getBorrowRateFor(vault);
    assertGt(borrowRate, 0); // Should be greater than zero.
  }

  // This test is applicable only for CompoundV3
  function testFail_getInterestRatesWithNoMapping() public {
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = compoundV3;

    BorrowingVault v = new BorrowingVault(
      address(0),
      address(0),
      address(0),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH",
      providers,
      DEFAULT_MAX_LTV,
      DEFAULT_LIQ_RATIO
    );

    compoundV3.getDepositRateFor(v);
  }

  function test_twoDeposits() public {
    do_deposit(DEPOSIT_AMOUNT, vault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, vault, BOB);
  }
}
