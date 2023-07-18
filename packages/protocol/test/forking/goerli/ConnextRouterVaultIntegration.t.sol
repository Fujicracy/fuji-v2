// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {ForkingSetup2} from "../ForkingSetup2.sol";
import {Routines} from "../../utils/Routines.sol";
import {BorrowingVaultUpgradeable as BVault} from
  "../../../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {AaveV3Goerli as SampleProvider} from "../../../src/providers/goerli/AaveV3Goerli.sol";
import {
  ConnextRouter, ConnextHandler, XReceiveProxy
} from "../../../src/routers/ConnextRouter.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";

bool constant DEBUG = true;

contract ConnextRouterVaultIntegrations is Routines, ForkingSetup2 {
  using Math for uint256;

  BVault public vault;
  address[] public vaults;

  SampleProvider sprovider;

  ConnextHandler public connextHandler;
  XReceiveProxy public xReceiveProxy;

  uint256 internal constant DEPOSIT_AMOUNT = 0.25 ether;
  uint256 internal constant BORROW_AMOUNT = 2e6;

  address collateralAsset;
  address debtAsset;

  function setUp() public {
    setUpFork("goerli");

    sprovider = SampleProvider(getAddress("Aave_V3_Goerli"));
    vm.label(address(sprovider), "SampleProvider");

    vm.startPrank(msg.sender);
    setOrDeployChief(true);
    setOrDeployConnextRouter(true);
    setOrDeployFujiOracle(true);
    setOrDeployBorrowingVaultFactory(true, true);
    vaults = deployBorrowingVaults();
    vm.stopPrank();
    /*setBorrowingVaults();*/

    vault = BVault(payable(vaults[0]));

    collateralAsset = vault.asset();
    debtAsset = vault.debtAsset();

    connextHandler = connextRouter.handler();
    xReceiveProxy = XReceiveProxy(connextRouter.xReceiveProxy());

    vm.startPrank(address(timelock));
    // Assume the same address of xreceive in all domains.
    connextRouter.setRouter(GOERLI_DOMAIN, address(xReceiveProxy));
    connextRouter.setRouter(OPTIMISM_GOERLI_DOMAIN, address(xReceiveProxy));
    connextRouter.setRouter(MUMBAI_DOMAIN, address(xReceiveProxy));
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
    address receiver_ = connextRouter.xReceiveProxy();
    address handler_ = address(connextRouter.handler());

    assertEq(chief_, address(chief));
    assertEq(receiver_, address(xReceiveProxy));
    assertEq(handler_, address(connextHandler));
  }

  function test_attemptMaxPaybackSDKOverestimate() public {
    // Assume ALICE already has a position in this domain.
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(address(vault)), ALICE);

    // Record Alice debt for future assertions.
    uint256 aliceDebtBefore = vault.balanceOfDebt(ALICE);
    if (DEBUG) {
      console.log("aliceDebtBefore", aliceDebtBefore);
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
      feeAndSlippage = BORROW_AMOUNT.mulDiv(5, 1e4) + BORROW_AMOUNT.mulDiv(3, 1e3);
      uint256 buffer = overEstimate + feeAndSlippage;
      sdkAmount = BORROW_AMOUNT + buffer;
      args[0] = abi.encode(address(vault), sdkAmount, ALICE, address(connextRouter));
    }

    bytes memory callData = abi.encode(actions, args);

    // send directly the bridged funds to our xReceiver; thus simulating ConnextCore
    // behaviour. However, the final received amount is resultant
    // of deducting the Connext fee and slippage amount.
    uint256 finalReceived;
    {
      finalReceived = sdkAmount - feeAndSlippage;
      deal(debtAsset, address(xReceiveProxy), finalReceived);
    }

    vm.startPrank(connextCore);
    // Call pretended from connextCore to xReceiveProxy from a seperate domain (eg. optimism goerli).
    // simulated to be the same address as ConnextRouter in this test.
    xReceiveProxy.xReceive(
      "", finalReceived, debtAsset, address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    {
      // Assert Alice's debt is now zero by the amount in cross-tx.
      uint256 aliceDebtAfter = vault.balanceOfDebt(ALICE);
      uint256 aliceDebSharestAfter = vault.balanceOfDebtShares(ALICE);
      uint256 aliceUSDCBalanceAfter = IERC20(debtAsset).balanceOf(ALICE);

      assertEq(aliceDebtAfter, 0);
      assertEq(aliceDebSharestAfter, 0);
      // Assert Alice has receive any overestimate
      assertEq(aliceUSDCBalanceAfter, aliceDebtBefore + overEstimate);

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
    // Assume ALICE already has a position in this domain.
    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, IVault(address(vault)), ALICE);

    // Record Alice debt for future assertions.
    uint256 aliceDebtBefore = vault.balanceOfDebt(ALICE);
    if (DEBUG) {
      console.log("aliceDebtBefore", aliceDebtBefore);
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
      feeAndSlippage = BORROW_AMOUNT.mulDiv(5, 1e4) + BORROW_AMOUNT.mulDiv(3, 1e3);
      sdkAmount = BORROW_AMOUNT + feeAndSlippage - underEstimation;
      args[0] = abi.encode(address(vault), sdkAmount, ALICE, address(connextRouter));
    }

    bytes memory callData = abi.encode(actions, args);

    // send directly the bridged funds to our xReceiver; thus simulating ConnextCore
    // behaviour. However, the final received amount is resultant
    // of deducting the Connext fee and slippage amount.
    uint256 finalReceived;
    {
      finalReceived = sdkAmount - feeAndSlippage;
      deal(debtAsset, address(xReceiveProxy), finalReceived);
    }

    vm.startPrank(connextCore);
    // Call pretended from connextCore to xReceiveProxy from a seperate domain (eg. optimism goerli).
    // simulated to be the same address as ConnextRouter in this test.
    xReceiveProxy.xReceive(
      "", finalReceived, debtAsset, address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    {
      // Assert Alice's debt is now zero by the amount in cross-tx.
      uint256 aliceDebtAfter = vault.balanceOfDebt(ALICE);
      uint256 aliceDebSharestAfter = vault.balanceOfDebtShares(ALICE);
      uint256 aliceUSDCBalanceAfter = IERC20(debtAsset).balanceOf(ALICE);

      assertGt(aliceDebtAfter, 0);
      assertGt(aliceDebSharestAfter, 0);
      // Assert Alice has NOT receive any overestimate
      assertEq(aliceUSDCBalanceAfter, aliceDebtBefore);

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
}
