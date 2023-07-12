// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {console} from "forge-std/console.sol";
import {Test} from "forge-std/Test.sol";
import {ConnextRouter, BaseRouter} from "../src/routers/ConnextRouter.sol";
import {
  BorrowingVaultUpgradeable,
  BaseVaultUpgradeable
} from "../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {VaultPermissions} from "../src/vaults/VaultPermissions.sol";
import {RebalancerManager} from "../src/RebalancerManager.sol";

contract ErrorSelectors is Test {
  function test_getBaseRouterErrorSelectors() public view {
    // error BaseRouter__bundleInternal_notFirstAction();
    console.log("BaseRouter.BaseRouter__bundleInternal_notFirstAction.selector");
    console.logBytes4(BaseRouter.BaseRouter__bundleInternal_notFirstAction.selector);

    // error BaseRouter__bundleInternal_paramsMismatch();
    console.log("BaseRouter.BaseRouter__bundleInternal_paramsMismatch.selector");
    console.logBytes4(BaseRouter.BaseRouter__bundleInternal_paramsMismatch.selector);

    // error BaseRouter__bundleInternal_flashloanInvalidRequestor();
    console.log("BaseRouter.BaseRouter__bundleInternal_flashloanInvalidRequestor.selector");
    console.logBytes4(BaseRouter.BaseRouter__bundleInternal_flashloanInvalidRequestor.selector);

    // error BaseRouter__bundleInternal_noBalanceChange();
    console.log("BaseRouter.BaseRouter__bundleInternal_noBalanceChange.selector");
    console.logBytes4(BaseRouter.BaseRouter__bundleInternal_noBalanceChange.selector);

    // error BaseRouter__bundleInternal_notBeneficiary();
    console.log("BaseRouter.BaseRouter__bundleInternal_notBeneficiary.selector");
    console.logBytes4(BaseRouter.BaseRouter__bundleInternal_notBeneficiary.selector);

    // error BaseRouter__checkVaultInput_notActiveVault();
    console.log("BaseRouter.BaseRouter__checkVaultInput_notActiveVault.selector");
    console.logBytes4(BaseRouter.BaseRouter__checkVaultInput_notActiveVault.selector);

    // error BaseRouter__bundleInternal_notAllowedSwapper();
    console.log("BaseRouter.BaseRouter__bundleInternal_notAllowedSwapper.selector");
    console.logBytes4(BaseRouter.BaseRouter__bundleInternal_notAllowedSwapper.selector);

    // error BaseRouter__checkValidFlasher_notAllowedFlasher();
    console.log("BaseRouter.BaseRouter__checkValidFlasher_notAllowedFlasher.selector");
    console.logBytes4(BaseRouter.BaseRouter__checkValidFlasher_notAllowedFlasher.selector);

    // error BaseRouter__handlePermit_notPermitAction();
    console.log("BaseRouter.BaseRouter__handlePermit_notPermitAction.selector");
    console.logBytes4(BaseRouter.BaseRouter__handlePermit_notPermitAction.selector);

    // error BaseRouter__safeTransferETH_transferFailed();
    console.log("BaseRouter.BaseRouter__safeTransferETH_transferFailed.selector");
    console.logBytes4(BaseRouter.BaseRouter__safeTransferETH_transferFailed.selector);

    // error BaseRouter__receive_senderNotWETH();
    console.log("BaseRouter.BaseRouter__receive_senderNotWETH.selector");
    console.logBytes4(BaseRouter.BaseRouter__receive_senderNotWETH.selector);

    // error BaseRouter__fallback_notAllowed();
    console.log("BaseRouter.BaseRouter__fallback_notAllowed.selector");
    console.logBytes4(BaseRouter.BaseRouter__fallback_notAllowed.selector);

    // error BaseRouter__allowCaller_noAllowChange();
    console.log("BaseRouter.BaseRouter__allowCaller_noAllowChange.selector");
    console.logBytes4(BaseRouter.BaseRouter__allowCaller_noAllowChange.selector);

    // error BaseRouter__isInTokenList_snapshotLimitReached();
    console.log("BaseRouter.BaseRouter__isInTokenList_snapshotLimitReached.selector");
    console.logBytes4(BaseRouter.BaseRouter__isInTokenList_snapshotLimitReached.selector);

    // error BaseRouter__xBundleFlashloan_insufficientFlashloanBalance();
    console.log("BaseRouter.BaseRouter__xBundleFlashloan_insufficientFlashloanBalance.selector");
    console.logBytes4(
      (BaseRouter.BaseRouter__xBundleFlashloan_insufficientFlashloanBalance.selector)
    );

    // error BaseRouter__checkIfAddressZero_invalidZeroAddress();
    console.log("BaseRouter.BaseRouter__checkIfAddressZero_invalidZeroAddress.selector");
    console.logBytes4(BaseRouter.BaseRouter__checkIfAddressZero_invalidZeroAddress.selector);
  }

  function test_getConnextRouterErrorSelectors() public view {
    //   error ConnextRouter__setRouter_invalidInput();
    console.log("ConnextRouter.ConnextRouter__setRouter_invalidInput.selector");
    console.logBytes4(ConnextRouter.ConnextRouter__setRouter_invalidInput.selector);

    // error ConnextRouter__xReceive_notAllowedCaller();
    console.log("ConnextRouter.ConnextRouter__xReceive_notAllowedCaller.selector");
    console.logBytes4(ConnextRouter.ConnextRouter__xReceive_notAllowedCaller.selector);

    // error ConnextRouter__xReceiver_noValueTransferUseXbundle();
    console.log("ConnextRouter.ConnextRouter__xReceiver_noValueTransferUseXbundle.selector");
    console.logBytes4(ConnextRouter.ConnextRouter__xReceiver_noValueTransferUseXbundle.selector);

    // error ConnnextRouter__xBundleConnext_notSelfCalled();
    console.log("ConnextRouter.ConnnextRouter__xBundleConnext_notSelfCalled.selector");
    console.logBytes4(ConnextRouter.ConnnextRouter__xBundleConnext_notSelfCalled.selector);

    // error ConnextRouter__crossTransfer_checkReceiver();
    console.log("ConnextRouter.ConnextRouter__crossTransfer_checkReceiver.selector");
    console.logBytes4(ConnextRouter.ConnextRouter__crossTransfer_checkReceiver.selector);
  }

  function test_getBaseVaultUpgradeableErrorSelectors() public view {
    // error BaseVault__initialize_invalidInput();
    console.log("BaseVaultUpgradeable.BaseVault__initialize_invalidInput.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__initialize_invalidInput.selector);

    // error BaseVault__initializeVaultShares_alreadyInitialized();
    console.log("BaseVaultUpgradeable.BaseVault__initializeVaultShares_alreadyInitialized.selector");
    console.logBytes4(
      BaseVaultUpgradeable.BaseVault__initializeVaultShares_alreadyInitialized.selector
    );
    // error BaseVault__initialize_lessThanMin();
    console.log("BaseVaultUpgradeable.BaseVault__initialize_lessThanMin.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__initialize_lessThanMin.selector);

    // error BaseVault__deposit_invalidInput();
    console.log("BaseVaultUpgradeable.BaseVault__deposit_invalidInput.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__deposit_invalidInput.selector);

    // error BaseVault__deposit_moreThanMax();
    console.log("BaseVaultUpgradeable.BaseVault__deposit_moreThanMax.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__deposit_moreThanMax.selector);

    // error BaseVault__deposit_lessThanMin();
    console.log("BaseVaultUpgradeable.BaseVault__deposit_lessThanMin.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__deposit_lessThanMin.selector);

    // error BaseVault__withdraw_invalidInput();
    console.log("BaseVaultUpgradeable.BaseVault__initialize_invalidInput.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__initialize_invalidInput.selector);

    // error BaseVault__setter_invalidInput();
    console.log("BaseVaultUpgradeable.BaseVault__setter_invalidInput.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__setter_invalidInput.selector);

    // error BaseVault__checkRebalanceFee_excessFee();
    console.log("BaseVaultUpgradeable.BaseVault__checkRebalanceFee_excessFee.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__checkRebalanceFee_excessFee.selector);

    // error BaseVault__deposit_slippageTooHigh();
    console.log("BaseVaultUpgradeable.BaseVault__deposit_slippageTooHigh.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__deposit_slippageTooHigh.selector);

    // error BaseVault__mint_slippageTooHigh();
    console.log("BaseVaultUpgradeable.BaseVault__initialize_invalidInput.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__initialize_invalidInput.selector);

    // error BaseVault__withdraw_slippageTooHigh();
    console.log("BaseVaultUpgradeable.BaseVault__withdraw_slippageTooHigh.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__withdraw_slippageTooHigh.selector);

    // error BaseVault__redeem_slippageTooHigh();
    console.log("BaseVaultUpgradeable.BaseVault__redeem_slippageTooHigh.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__redeem_slippageTooHigh.selector);

    // error BaseVault__useIncreaseWithdrawAllowance();
    console.log("BaseVaultUpgradeable.BaseVault__useIncreaseWithdrawAllowance.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__useIncreaseWithdrawAllowance.selector);

    // error BaseVault__useDecreaseWithdrawAllowance();
    console.log("BaseVaultUpgradeable.BaseVault__useDecreaseWithdrawAllowance.selector");
    console.logBytes4(BaseVaultUpgradeable.BaseVault__useDecreaseWithdrawAllowance.selector);
  }

  function test_BorrowingVaultUpgradeableErrorSelectors() public view {
    // error BorrowingVault__borrow_invalidInput();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__borrow_invalidInput.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__borrow_invalidInput.selector);

    // error BorrowingVault__borrow_moreThanAllowed();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__borrow_moreThanAllowed.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__borrow_moreThanAllowed.selector);

    // error BorrowingVault__payback_invalidInput();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__payback_invalidInput.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__payback_invalidInput.selector);

    // error BorrowingVault__beforeTokenTransfer_moreThanMax();
    console.log(
      "BorrowingVaultUpgradeable.BorrowingVault__beforeTokenTransfer_moreThanMax.selector"
    );
    console.logBytes4(
      BorrowingVaultUpgradeable.BorrowingVault__beforeTokenTransfer_moreThanMax.selector
    );

    // error BorrowingVault__liquidate_invalidInput();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__liquidate_invalidInput.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__liquidate_invalidInput.selector);

    // error BorrowingVault__liquidate_positionHealthy();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__liquidate_positionHealthy.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__liquidate_positionHealthy.selector);

    // error BorrowingVault__liquidate_moreThanAllowed();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__liquidate_moreThanAllowed.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__liquidate_moreThanAllowed.selector);

    // error BorrowingVault__rebalance_invalidProvider();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__rebalance_invalidProvider.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__rebalance_invalidProvider.selector);

    // error BorrowingVault__borrow_slippageTooHigh();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__borrow_slippageTooHigh.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__borrow_slippageTooHigh.selector);

    // error BorrowingVault__mintDebt_slippageTooHigh();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__mintDebt_slippageTooHigh.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__mintDebt_slippageTooHigh.selector);

    // error BorrowingVault__payback_slippageTooHigh();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__payback_slippageTooHigh.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__payback_slippageTooHigh.selector);

    // error BorrowingVault__burnDebt_slippageTooHigh();
    console.log("BorrowingVaultUpgradeable.BorrowingVault__burnDebt_slippageTooHigh.selector");
    console.logBytes4(BorrowingVaultUpgradeable.BorrowingVault__burnDebt_slippageTooHigh.selector);

    // error BorrowingVault__burnDebtShares_amountExceedsBalance();
    console.log(
      "BorrowingVaultUpgradeable.BorrowingVault__burnDebtShares_amountExceedsBalance.selector"
    );
    console.logBytes4(
      BorrowingVaultUpgradeable.BorrowingVault__burnDebtShares_amountExceedsBalance.selector
    );

    // error BorrowingVault__initializeVaultShares_assetDebtRatioExceedsMaxLtv();
    console.log(
      "BorrowingVaultUpgradeable.BorrowingVault__initializeVaultShares_assetDebtRatioExceedsMaxLtv.selector"
    );
    console.logBytes4(
      BorrowingVaultUpgradeable
        .BorrowingVault__initializeVaultShares_assetDebtRatioExceedsMaxLtv
        .selector
    );
  }

  function test_VaultPermissionsErrorSelectors() public view {
    //   error VaultPermissions__zeroAddress();
    console.log("VaultPermissions.VaultPermissions__zeroAddress.selector");
    console.logBytes4(VaultPermissions.VaultPermissions__zeroAddress.selector);

    // error VaultPermissions__expiredDeadline();
    console.log("VaultPermissions.VaultPermissions__expiredDeadline.selector");
    console.logBytes4(VaultPermissions.VaultPermissions__expiredDeadline.selector);

    // error VaultPermissions__invalidSignature();
    console.log("VaultPermissions.VaultPermissions__invalidSignature.selector");
    console.logBytes4(VaultPermissions.VaultPermissions__invalidSignature.selector);

    // error VaultPermissions__insufficientWithdrawAllowance();
    console.log("VaultPermissions.VaultPermissions__insufficientWithdrawAllowance.selector");
    console.logBytes4(VaultPermissions.VaultPermissions__insufficientWithdrawAllowance.selector);

    // error VaultPermissions__insufficientBorrowAllowance();
    console.log("VaultPermissions.VaultPermissions__insufficientBorrowAllowance.selector");
    console.logBytes4(VaultPermissions.VaultPermissions__insufficientBorrowAllowance.selector);

    // error VaultPermissions__allowanceBelowZero();
    console.log("VaultPermissions.VaultPermissions__allowanceBelowZero.selector");
    console.logBytes4(VaultPermissions.VaultPermissions__allowanceBelowZero.selector);
  }

  function test_getRebalanceManagerErrorSelectors() public view {
    // error RebalancerManager__rebalanceVault_notValidExecutor();
    console.log("RebalancerManager.RebalancerManager__rebalanceVault_notValidExecutor.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__rebalanceVault_notValidExecutor.selector);

    // error RebalancerManager__rebalanceVault_notValidFlasher();
    console.log("RebalancerManager.RebalancerManager__rebalanceVault_notValidFlasher.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__rebalanceVault_notValidFlasher.selector);

    // error RebalancerManager__rebalanceVault_invalidAmount();
    console.log("RebalancerManager.RebalancerManager__rebalanceVault_notValidExecutor.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__rebalanceVault_notValidExecutor.selector);

    // error RebalancerManager__checkAssetsAmount_invalidAmount();
    console.log("RebalancerManager.RebalancerManager__checkAssetsAmount_invalidAmount.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__checkAssetsAmount_invalidAmount.selector);

    // error RebalancerManager__checkDebtAmount_invalidAmount();
    console.log("RebalancerManager.RebalancerManager__checkDebtAmount_invalidAmount.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__checkDebtAmount_invalidAmount.selector);

    // error RebalancerManager__checkLtvChange_invalidAmount();
    console.log("RebalancerManager.RebalancerManager__checkLtvChange_invalidAmount.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__checkLtvChange_invalidAmount.selector);

    // error RebalancerManager__getFlashloan_flashloanFailed();
    console.log("RebalancerManager.RebalancerManager__getFlashloan_flashloanFailed.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__getFlashloan_flashloanFailed.selector);

    // error RebalancerManager__getFlashloan_notEmptyEntryPoint();
    console.log("RebalancerManager.RebalancerManager__getFlashloan_notEmptyEntryPoint.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__getFlashloan_notEmptyEntryPoint.selector);

    // error RebalancerManager__completeRebalance_invalidEntryPoint();
    console.log("RebalancerManager.RebalancerManager__completeRebalance_invalidEntryPoint.selector");
    console.logBytes4(
      RebalancerManager.RebalancerManager__completeRebalance_invalidEntryPoint.selector
    );

    // error RebalancerManager__allowExecutor_noAllowChange();
    console.log("RebalancerManager.RebalancerManager__allowExecutor_noAllowChange.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__allowExecutor_noAllowChange.selector);

    // error RebalancerManager__zeroAddress();
    console.log("RebalancerManager.RebalancerManager__zeroAddress.selector");
    console.logBytes4(RebalancerManager.RebalancerManager__zeroAddress.selector);
  }
}
