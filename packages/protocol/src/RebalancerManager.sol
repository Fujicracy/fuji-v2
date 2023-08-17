// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title RebalancerManager
 *
 * @author Fujidao Labs
 *
 * @notice  Contract that faciliates rebalancing of the FujiV2 vaults.
 */

import {IRebalancerManager} from "./interfaces/IRebalancerManager.sol";
import {IVault} from "./interfaces/IVault.sol";
import {BorrowingVault} from "./vaults/borrowing/BorrowingVault.sol";
import {IFlasher} from "./interfaces/IFlasher.sol";
import {ILendingProvider} from "./interfaces/ILendingProvider.sol";
import {SystemAccessControl} from "./access/SystemAccessControl.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract RebalancerManager is IRebalancerManager, SystemAccessControl {
  using SafeERC20 for IERC20;

  /// @dev Custom errors
  error RebalancerManager__rebalanceVault_notValidExecutor();
  error RebalancerManager__rebalanceVault_notValidFlasher();
  error RebalancerManager__rebalanceVault_invalidAmount();
  error RebalancerManager__checkAssetsAmount_invalidAmount();
  error RebalancerManager__checkDebtAmount_invalidAmount();
  error RebalancerManager__checkLtvChange_invalidAmount();
  error RebalancerManager__getFlashloan_flashloanFailed();
  error RebalancerManager__getFlashloan_notEmptyEntryPoint();
  error RebalancerManager__completeRebalance_invalidEntryPoint();
  error RebalancerManager__allowExecutor_noAllowChange();
  error RebalancerManager__zeroAddress();

  mapping(address => bool) public allowedExecutor;

  bytes32 private _entryPoint;

  constructor(address chief_) {
    __SystemAccessControl_init(chief_);
  }

  /// @inheritdoc IRebalancerManager
  function rebalanceVault(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    external
    override
    returns (bool success)
  {
    if (!allowedExecutor[msg.sender]) {
      revert RebalancerManager__rebalanceVault_notValidExecutor();
    }

    if (assets == type(uint256).max) {
      assets = from.getDepositBalance(address(vault), vault);
    }

    _checkAssetsAmount(vault, assets, from);

    if (vault.debtAsset() == address(0)) {
      // YieldVault
      if (assets == 0) {
        // Should at least move some assets across providers.
        revert RebalancerManager__rebalanceVault_invalidAmount();
      }
      vault.rebalance(assets, 0, from, to, 0, setToAsActiveProvider);
    } else {
      // BorrowingVault
      if (debt == type(uint256).max) {
        debt = from.getBorrowBalance(address(vault), vault);
      }

      if (assets == 0 && debt == 0) {
        // Should at least move some assets or debt across providers.
        revert RebalancerManager__rebalanceVault_invalidAmount();
      }

      if (debt == 0) {
        // Rebalance only assets do not require flashloan
        vault.rebalance(assets, 0, from, to, 0, setToAsActiveProvider);
      } else {
        // Check flasher is valid
        if (!chief.allowedFlasher(address(flasher))) {
          revert RebalancerManager__rebalanceVault_notValidFlasher();
        }
        _checkDebtAmount(vault, debt, from);
        _checkLtvChange(vault, from, to, assets, debt);
        _getFlashloan(vault, assets, debt, from, to, flasher, setToAsActiveProvider);
      }
    }

    success = true;
  }

  /// @inheritdoc IRebalancerManager
  function allowExecutor(address executor, bool allowed) external override onlyTimelock {
    if (executor == address(0)) {
      revert RebalancerManager__zeroAddress();
    }
    if (allowedExecutor[executor] == allowed) {
      revert RebalancerManager__allowExecutor_noAllowChange();
    }
    allowedExecutor[executor] = allowed;
    emit AllowExecutor(executor, allowed);
  }

  /**
   * @dev Checks `amount` is < than current asset balance of `vault` at provider `from`.
   *
   * @param vault address
   * @param amount to be rebalanced to check against
   * @param from provider address
   */
  function _checkAssetsAmount(IVault vault, uint256 amount, ILendingProvider from) internal view {
    uint256 assetsAtProvider = from.getDepositBalance(address(vault), vault);
    if (amount > assetsAtProvider) {
      revert RebalancerManager__checkAssetsAmount_invalidAmount();
    }
  }

  /**
   * @dev Checks `amount` is < than current debt balance of `vault` at provider `from`.
   *
   * @param vault address
   * @param amount rebalanced to check against
   * @param from provider address
   */
  function _checkDebtAmount(IVault vault, uint256 amount, ILendingProvider from) internal view {
    uint256 debtAtProvider = from.getBorrowBalance(address(vault), vault);
    if (amount > debtAtProvider) {
      revert RebalancerManager__checkDebtAmount_invalidAmount();
    }
  }

  /**
   * @dev Checks if the rebalance operation will break the current LTV
   *
   * @param vault address
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from provider where `assets` and `debt` are
   * @param to provider where `assets` and `debt` will be
   */
  function _checkLtvChange(
    IVault vault,
    ILendingProvider from,
    ILendingProvider to,
    uint256 assets,
    uint256 debt
  )
    internal
    view
  {
    {
      BorrowingVault bvault = BorrowingVault(payable(address(vault)));
      uint256 maxLtv = bvault.maxLtv();
      uint8 assetDecimals = vault.decimals();
      uint8 debtDecimals = bvault.debtDecimals();

      // Calculate ltv after rebalance at `from`.
      uint256 assetsFrom = from.getDepositBalance(address(bvault), bvault) - assets;
      uint256 debtFrom = from.getBorrowBalance(address(bvault), bvault) - debt;

      // Calculate ltv after rebalance at `to`.
      uint256 assetsTo = to.getDepositBalance(address(bvault), bvault) + assets;
      uint256 debtTo = to.getBorrowBalance(address(bvault), bvault) + debt;

      uint256 price = bvault.oracle().getPriceOf(bvault.debtAsset(), bvault.asset(), debtDecimals);
      uint256 maxBorrowFrom = (assetsFrom * maxLtv * price) / (1e18 * 10 ** assetDecimals);
      uint256 maxBorrowTo = (assetsTo * maxLtv * price) / (1e18 * 10 ** assetDecimals);

      if (debtFrom > maxBorrowFrom || debtTo > maxBorrowTo) {
        revert RebalancerManager__checkLtvChange_invalidAmount();
      }
    }
  }

  /**
   * @dev Sets a checkpoint for this address as the flashloan originator.
   *
   * @param requestorCall bytes sent to flashloan provider
   */
  function _checkAndSetEntryPoint(bytes memory requestorCall) internal {
    if (_entryPoint != "") {
      revert RebalancerManager__getFlashloan_notEmptyEntryPoint();
    }
    _entryPoint = keccak256(abi.encode(requestorCall));
  }

  /**
   * @dev Checks this address is the flashloan originator. This check applies to a
   * {BorrowingVault} only.
   *
   * @param vault being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from provider address
   * @param to provider address
   * @param flasher contract address
   * @param setToAsActiveProvider boolean to define `to` as active provider
   */
  function _checkReentry(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    internal
    view
  {
    bytes memory requestorCalldata = abi.encodeWithSelector(
      RebalancerManager.completeRebalance.selector,
      vault,
      assets,
      debt,
      from,
      to,
      flasher,
      setToAsActiveProvider
    );
    bytes32 hashCheck = keccak256(abi.encode(requestorCalldata));
    if (_entryPoint != hashCheck) {
      revert RebalancerManager__completeRebalance_invalidEntryPoint();
    }
  }

  /**
   * @dev Initiates flashloan for a rebalancing operation.
   *
   * @param vault being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from provider address
   * @param to provider address
   * @param flasher contract address
   * @param setToAsActiveProvider boolean to define `to` as active provider
   */
  function _getFlashloan(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    internal
  {
    bytes memory requestorCall = abi.encodeWithSelector(
      RebalancerManager.completeRebalance.selector,
      vault,
      assets,
      debt,
      from,
      to,
      flasher,
      setToAsActiveProvider
    );

    _checkAndSetEntryPoint(requestorCall);

    address debtAsset = vault.debtAsset();

    flasher.initiateFlashloan(debtAsset, debt, address(this), requestorCall);
  }

  /**
   * @notice Callback function that completes execution logic of a rebalance
   * operation with a flashloan.
   *
   * @param vault being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from provider address
   * @param to provider address
   * @param flasher contract address
   * @param setToAsActiveProvider boolean to define `to` as active provider
   *
   * @dev Requirements:
   * - Must check this address was the flashloan originator.
   * - Must clear the check state variable `_entryPoint`.
   */
  function completeRebalance(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    external
    returns (bool success)
  {
    // Check caller is a valid flasher
    if (!chief.allowedFlasher(msg.sender)) {
      revert RebalancerManager__rebalanceVault_notValidFlasher();
    }
    // Check flashloan originator is reentering properly
    _checkReentry(vault, assets, debt, from, to, flasher, setToAsActiveProvider);

    IERC20 debtAsset = IERC20(vault.debtAsset());

    if (debtAsset.balanceOf(address(this)) != debt) {
      revert RebalancerManager__getFlashloan_flashloanFailed();
    }

    debtAsset.safeIncreaseAllowance(address(vault), debt);

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debt);

    vault.rebalance(assets, debt, from, to, flashloanFee, setToAsActiveProvider);

    debtAsset.safeTransfer(address(flasher), debt + flashloanFee);

    // Re-initialize the `_entryPoint`.
    _entryPoint = "";
    success = true;
  }
}
