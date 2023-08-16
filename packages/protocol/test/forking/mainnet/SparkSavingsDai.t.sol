// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {Chief} from "../../../src/Chief.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SparkSavingsDai} from "../../../src/providers/mainnet/SparkSavingsDai.sol";
import {YieldVault} from "../../../src/vaults/yields/YieldVault.sol";

contract SparkSavingsDaiForkingTests is Routines, ForkingSetup {
  ILendingProvider public savingsDai;

  YieldVault public yvault;

  uint256 public constant DEPOSIT_AMOUNT = 10000e18;
  uint256 internal constant _INIT_SHARES = DEPOSIT_AMOUNT;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    chief = new Chief(true, true);

    collateralAsset = registry[MAINNET_DOMAIN].dai;
    vm.label(collateralAsset, "DAI");

    savingsDai = new SparkSavingsDai();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = savingsDai;

    yvault = new YieldVault(
      collateralAsset,
      address(chief),
      "Fuji-V2 DAI YieldVault",
      "fyvDAI",
      providers
    );

    _initializeVault(address(yvault), INITIALIZER, _INIT_SHARES);
  }

  function test_deposit() public {
    do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
  }

  function test_getBalances() public {
    do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
    uint256 depositBalance = yvault.totalAssets();
    assertApproxEqAbs(
      depositBalance, DEPOSIT_AMOUNT + _INIT_SHARES, (DEPOSIT_AMOUNT + _INIT_SHARES) / 100
    );
  }

  function test_getInterestRates() public {
    uint256 depositRate = savingsDai.getDepositRateFor(vault);
    assertGt(depositRate, 0); // Should be greater than zero.
    console.log("Deposit rate: %s", depositRate);

    uint256 refAPY = SparkSavingsDai(address(savingsDai)).getAPYforCurrentRateInSparkSavingsDai();
    console.log("Ref  APY: %s", refAPY);

    uint256 borrowRate = savingsDai.getBorrowRateFor(vault);
    assertEq(borrowRate, 0); // Should EQUAL to zero.
    console.log("Borrow rate: %s", borrowRate);
  }

  function test_twoDeposits() public {
    do_deposit(DEPOSIT_AMOUNT, yvault, ALICE);
    do_deposit(DEPOSIT_AMOUNT, yvault, BOB);
  }
}
