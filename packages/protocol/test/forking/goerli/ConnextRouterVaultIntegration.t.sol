// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {ForkingSetup2} from "../ForkingSetup2.sol";
import {Routines} from "../../utils/Routines.sol";
import {BorrowingVaultUpgradeable as BVault} from
  "../../../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {
  IV3Pool, AaveV3Goerli as SampleProvider
} from "../../../src/providers/goerli/AaveV3Goerli.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {ConnextRouter} from "../../../src/routers/ConnextRouter.sol";
import {ConnextHandler} from "../../../src/routers/ConnextHandler.sol";
import {ConnextReceiver} from "../../../src/routers/ConnextReceiver.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";

bool constant DEBUG = true;

contract ConnextRouterVaultIntegrations is Routines, ForkingSetup2 {
  error xReceiveFailed_recordedTransfer();

  using Math for uint256;

  BVault public vault;

  SampleProvider sprovider;

  ConnextHandler public connextHandler;
  ConnextReceiver public connextReceiver;

  uint256 internal constant DEPOSIT_AMOUNT = 0.25 ether;
  uint256 internal constant BORROW_AMOUNT = 998567;

  address collateralAsset;
  address debtAsset;

  function setUp() public {
    setUpNamedFork("goerli");

    sprovider = SampleProvider(getAddress("Aave_V3_Goerli"));
    vm.label(address(sprovider), "SampleProvider");

    setOrDeployChief(false);
    setOrDeployConnextRouter(false);
    setOrDeployFujiOracle(false);
    setOrDeployBorrowingVaultFactory(false, false);
    setOrDeployBorrowingVaults(false);

    vault = BVault(payable(allVaults[0].addr));

    collateralAsset = vault.asset();
    debtAsset = vault.debtAsset();

    connextHandler = connextRouter.handler();
    connextReceiver = ConnextReceiver(connextRouter.connextReceiver());

    vm.startPrank(address(timelock));
    // Assume the same address of xreceive in all domains.
    connextRouter.setReceiver(GOERLI_DOMAIN, address(connextReceiver));
    connextRouter.setReceiver(OPTIMISM_GOERLI_DOMAIN, address(connextReceiver));
    connextRouter.setReceiver(MUMBAI_DOMAIN, address(connextReceiver));
    vm.stopPrank();
  }

  function test_basicVaultParamsInitialized() public {
    address asset_ = vault.asset();
    address debtAsset_ = vault.debtAsset();
    uint256 maxltv_ = vault.maxLtv();
    uint256 liqRatio_ = vault.liqRatio();
    address oracle_ = address(vault.oracle());
    address activeProvider_ = address(vault.activeProvider());
    uint256 totalSupply_ = vault.totalSupply();
    uint256 debtSharesSupply_ = vault.debtSharesSupply();

    // console.log("asset", asset_, "debtAsset", debtAsset_);
    // console.log("maxltv", maxltv_, "liqRatio", liqRatio_);
    // console.log("oracle", oracle_, "activeProvider", activeProvider);
    // console.log("totalSupply", totalSupply_, "debtSharesSupply", debtSharesSupply_);

    assertNotEq(asset_, address(0));
    assertNotEq(debtAsset_, address(0));
    assertNotEq(oracle_, address(0));
    assertNotEq(activeProvider_, address(0));
    assertGt(maxltv_, 0);
    assertGt(liqRatio_, 0);
    assertGt(totalSupply_, 0);
    assertEq(debtSharesSupply_, 0);
  }

  function test_basicConnextRouterInitialized() public {
    address chief_ = address(connextRouter.chief());
    address receiver_ = connextRouter.connextReceiver();
    address handler_ = address(connextRouter.handler());

    assertEq(chief_, address(chief));
    assertEq(receiver_, address(connextReceiver));
    assertEq(handler_, address(connextHandler));
  }

  function test_attemptMaxPaybackSDKOverestimate() public {
    __doUnbalanceDebtToSharesRatio(address(vault));

    // Assume ALICE already has a position in this domain.
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(address(vault)), ALICE);

    __closeBOB(address(vault));

    // Record Alice debt for future assertions.
    uint256 aliceDebtBefore = vault.balanceOfDebt(ALICE);
    uint256 aliceDebtSharesBefore = vault.balanceOfDebtShares(ALICE);
    if (DEBUG) {
      console.log("Alice original debt", BORROW_AMOUNT);
      console.log("debtShare-to-debt-ratio-alteration");
      console.log("aliceDebtBeforeXCall", aliceDebtBefore);
      console.log("aliceDebtSharesBeforeXCall", aliceDebtSharesBefore);
    }

    // From a seperate domain ALICE wants to make a max payback
    // The SDK prepares the bundle for her.
    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    uint256 sdkAmount;
    uint256 feeAndSlippage;
    uint256 overEstimate = 1000 wei;
    {
      actions[0] = IRouter.Action.Payback;
      // We expect the SDK to estimate a buffer amount that includes:
      // - [ira] interest rate accrued buffer during time of xCall
      // - [cfee] the connext 5 bps fee
      // - [slippage] potential connext slippage
      // Therefore: estimate = ira + cfee + slippage
      feeAndSlippage = aliceDebtBefore.mulDiv(5, 1e4) + aliceDebtBefore.mulDiv(3, 1e3);
      uint256 buffer = overEstimate + feeAndSlippage;
      sdkAmount = aliceDebtBefore + buffer;
      args[0] = abi.encode(address(vault), sdkAmount, ALICE, address(connextRouter));
    }

    bytes memory callData = abi.encode(actions, args);

    // send directly the bridged funds to our xReceiver; thus simulating ConnextCore
    // behaviour. However, the final received amount is resultant
    // of deducting the Connext fee and slippage amount.
    uint256 finalReceived;
    {
      finalReceived = sdkAmount - feeAndSlippage;
      deal(debtAsset, address(connextReceiver), finalReceived);
    }

    vm.startPrank(connextCore);
    // Call pretended from connextCore to connextReceiver from a seperate domain (eg. optimism goerli).
    // simulated to be the same address as ConnextRouter in this test.
    connextReceiver.xReceive(
      "0x01", finalReceived, debtAsset, address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    // Handler should have no funds
    if (IERC20(debtAsset).balanceOf(address(connextHandler)) > 0) {
      revert xReceiveFailed_recordedTransfer();
    }

    {
      // Assert Alice's debt is now zero by the amount in cross-tx.
      uint256 aliceDebtAfter = vault.balanceOfDebt(ALICE);
      uint256 aliceDebSharestAfter = vault.balanceOfDebtShares(ALICE);
      uint256 aliceUSDCBalanceAfter = IERC20(debtAsset).balanceOf(ALICE);

      assertEq(aliceDebtAfter, 0);
      assertEq(aliceDebSharestAfter, 0);
      // Assert Alice has receive any overestimate
      assertEq(aliceUSDCBalanceAfter, BORROW_AMOUNT + overEstimate);

      if (DEBUG) {
        console.log("aliceDebtAfter", aliceDebtAfter, "aliceDebSharestAfter", aliceDebSharestAfter);
        console.log("aliceUSDCBalanceAfter", aliceUSDCBalanceAfter);
      }
    }

    {
      // Check vault status
      uint256 vaultDebtSharesSupply = vault.debtSharesSupply();
      uint256 vaultDebtBalanceAtProvider =
        sprovider.getBorrowBalance(address(vault), IVault(address(vault)));

      assertEq(vaultDebtSharesSupply, 0);
      assertEq(vaultDebtBalanceAtProvider, 0);

      if (DEBUG) {
        console.log("vaultDebtSharesSupply", vaultDebtSharesSupply);
        console.log("vaultDebtBalanceAtProvider", vaultDebtBalanceAtProvider);
      }
    }
  }

  function test_attemptMaxPaybackSDKUnderestimate() public {
    __doUnbalanceDebtToSharesRatio(address(vault));

    // Assume ALICE already has a position in this domain.
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(address(vault)), ALICE);

    __closeBOB(address(vault));

    // Record Alice debt for future assertions.
    uint256 aliceDebtBefore = vault.balanceOfDebt(ALICE);
    uint256 aliceDebtSharesBefore = vault.balanceOfDebtShares(ALICE);
    if (DEBUG) {
      console.log("Alice original debt", BORROW_AMOUNT);
      console.log("debtShare-to-debt-ratio-alteration");
      console.log("aliceDebtBeforeXCall", aliceDebtBefore);
      console.log("aliceDebtSharesBeforeXCall", aliceDebtSharesBefore);
    }

    // From a seperate domain ALICE wants to make a max payback
    // The SDK prepares the bundle for her.
    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    uint256 sdkAmount;
    uint256 feeAndSlippage;
    uint256 underEstimation = 99999 wei;
    {
      actions[0] = IRouter.Action.Payback;
      // We expect the SDK to estimate a buffer amount that includes:
      // - [ira] interest rate accrued buffer during time of xCall
      // - [cfee] the connext 5 bps fee
      // - [slippage] potential connext slippage
      // Therefore: estimate = ira + cfee + slippage
      feeAndSlippage = aliceDebtBefore.mulDiv(5, 1e4) + aliceDebtBefore.mulDiv(3, 1e3);
      sdkAmount = aliceDebtBefore + feeAndSlippage - underEstimation;
      args[0] = abi.encode(address(vault), sdkAmount, ALICE, address(connextRouter));
    }

    bytes memory callData = abi.encode(actions, args);

    // send directly the bridged funds to our xReceiver; thus simulating ConnextCore
    // behaviour. However, the final received amount is resultant
    // of deducting the Connext fee and slippage amount.
    uint256 finalReceived;
    {
      finalReceived = sdkAmount - feeAndSlippage;
      deal(debtAsset, address(connextReceiver), finalReceived);
    }

    vm.startPrank(connextCore);
    // Call pretended from connextCore to connextReceiver from a seperate domain (eg. optimism goerli).
    // simulated to be the same address as ConnextRouter in this test.
    connextReceiver.xReceive(
      "0x01", finalReceived, debtAsset, address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    // Handler should have no funds
    if (IERC20(debtAsset).balanceOf(address(connextHandler)) > 0) {
      revert xReceiveFailed_recordedTransfer();
    }

    {
      // Assert Alice's debt is now zero by the amount in cross-tx.
      uint256 aliceDebtAfter = vault.balanceOfDebt(ALICE);
      uint256 aliceDebSharestAfter = vault.balanceOfDebtShares(ALICE);
      uint256 aliceUSDCBalanceAfter = IERC20(debtAsset).balanceOf(ALICE);

      assertGt(aliceDebtAfter, 0);
      assertGt(aliceDebtAfter, 0);
      assertGt(aliceDebSharestAfter, 0);
      // Assert Alice has NOT receive any overestimate
      assertEq(aliceUSDCBalanceAfter, BORROW_AMOUNT);

      if (DEBUG) {
        console.log("aliceDebtAfter", aliceDebtAfter, "aliceDebSharestAfter", aliceDebSharestAfter);
        console.log("aliceUSDCBalanceAfter", aliceUSDCBalanceAfter);
      }
    }

    {
      // Check vault status
      uint256 vaultDebtSharesSupply = vault.debtSharesSupply();
      uint256 vaultDebtBalanceAtProvider =
        sprovider.getBorrowBalance(address(vault), IVault(address(vault)));

      assertGt(vaultDebtSharesSupply, 0);
      assertGt(vaultDebtBalanceAtProvider, 0);

      if (DEBUG) {
        console.log("vaultDebtSharesSupply", vaultDebtSharesSupply);
        console.log("vaultDebtBalanceAtProvider", vaultDebtBalanceAtProvider);
      }
    }
  }

  function __doUnbalanceDebtToSharesRatio(address vault_) internal {
    ILendingProvider activeProvider_ = BVault(payable(vault_)).activeProvider();

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(address(vault)), BOB);

    uint256 debtBalance = activeProvider_.getBorrowBalance(vault_, IVault(vault_));
    address debtAsset_ = IVault(vault_).debtAsset();

    uint256 amountToAdjust = debtBalance / 2;

    deal(debtAsset_, address(this), amountToAdjust);
    IV3Pool aave = IV3Pool(activeProvider_.approvedOperator(address(0), address(0), address(0)));

    IERC20(debtAsset_).approve(address(aave), amountToAdjust);
    aave.repay(debtAsset_, amountToAdjust, 2, vault_);
  }

  function __closeBOB(address vault_) internal {
    uint256 maxPayback = IVault(vault_).maxPayback(BOB);
    address debtAsset_ = IVault(vault_).debtAsset();
    deal(debtAsset_, address(this), maxPayback);
    IERC20(debtAsset_).approve(vault_, maxPayback);
    IVault(vault_).payback(maxPayback, BOB);
  }
}
