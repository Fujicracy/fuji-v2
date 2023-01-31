// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title MockRebalancerManager
 *
 * @author Fujidao Labs
 *
 * @notice Mock implementation of the RebalancerManager.
 */

import {IRebalancerManager} from "../interfaces/IRebalancerManager.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract MockRebalancerManager is IRebalancerManager {
  /// @dev Custom Errors
  error RebalancerManager__checkAssetsAmount_invalidAmount();
  error RebalancerManager__checkDebtAmount_invalidAmount();
  error RebalancerManager__getFlashloan_flashloanFailed();
  error RebalancerManager__getFlashloan_notEmptyEntryPoint();
  error RebalancerManager__completeRebalance_invalidEntryPoint();

  bytes32 private _entryPoint;

  constructor() {}

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
    returns (bool success)
  {
    _checkAssetsAmount(vault, assets, from);

    if (vault.debtAsset() == address(0)) {
      vault.rebalance(assets, 0, from, to, 0, setToAsActiveProvider);
    } else {
      _checkDebtAmount(vault, debt, from);

      _getFlashloan(vault, assets, debt, from, to, flasher, setToAsActiveProvider);
    }

    success = true;
  }

  function allowExecutor(address executor, bool allowed) external override {}

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
      MockRebalancerManager.completeRebalance.selector,
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
      MockRebalancerManager.completeRebalance.selector,
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

  /// @inheritdoc IRebalancerManager
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
    override
    returns (bool success)
  {
    _checkReentry(vault, assets, debt, from, to, flasher, setToAsActiveProvider);

    MockERC20 debtAsset = MockERC20(vault.debtAsset());

    if (debtAsset.balanceOf(address(this)) != debt) {
      revert RebalancerManager__getFlashloan_flashloanFailed();
    }

    debtAsset.approve(address(vault), debt);

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debt);

    vault.rebalance(assets, debt, from, to, flashloanFee, setToAsActiveProvider);

    debtAsset.transfer(address(flasher), debt + flashloanFee);

    _entryPoint = "";
    success = true;
  }
}
