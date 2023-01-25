// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title RebalancerManager
 * @author fujidao Labs
 *
 * @notice  Contract that triggers rebalancing of the FujiV2 vaults.
 */

import {IVault} from "./interfaces/IVault.sol";
import {IFlasher} from "./interfaces/IFlasher.sol";
import {IRouter} from "./interfaces/IRouter.sol"; // TODO remove when proper operating methods in Flasher contract is defined.
import {ILendingProvider} from "./interfaces/ILendingProvider.sol";
import {SystemAccessControl} from "./access/SystemAccessControl.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract RebalancerManager is SystemAccessControl {
  using SafeERC20 for IERC20;

  event AllowExecutor(address indexed executor, bool allowed);

  /// @dev Custom errors
  error RebalancerManager__rebalanceVault_notValidExecutor();
  error RebalancerManager__rebalanceVault_notValidFlasher();
  error RebalancerManager__checkAssetsAmount_invalidAmount();
  error RebalancerManager__checkDebtAmount_invalidAmount();
  error RebalancerManager__getFlashloan_flashloanFailed();
  error RebalancerManager__getFlashloan_notEmptyEntryPoint();
  error RebalancerManager__completeRebalance_invalidEntryPoint();
  error RebalancerManager__allowExecutor_noAllowChange();
  error RebalancerManager__zeroAddress();

  mapping(address => bool) public allowedExecutor;

  bytes32 private _entryPoint;

  constructor(address chief_) SystemAccessControl(chief_) {}

  /**
   * @notice Rebalance funds of a vault between providers.
   * Requirements:
   * - Must only be called by a valid executor.
   * - Must check `assets` and `debt` amounts are less than `vault`'s managed amounts.
   *
   * @param vault address that will be rebalanced
   * @param assets amount to be rebalanced
   * @param debt amount to be rebalanced; Pass zero if `vault` is a  {YieldVault}
   * @param from provider address
   * @param to provider address
   * @param flasher address that will facilitate flashloan
   * @param setToAsActiveProvider boolean if `activeProvider` should change
   */
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
    if (!allowedExecutor[msg.sender]) {
      revert RebalancerManager__rebalanceVault_notValidExecutor();
    }
    _checkAssetsAmount(vault, assets, from);

    if (vault.debtAsset() == address(0)) {
      vault.rebalance(assets, 0, from, to, 0, setToAsActiveProvider);
    } else {
      _checkDebtAmount(vault, debt, from);
      if (!chief.allowedFlasher(address(flasher))) {
        revert RebalancerManager__rebalanceVault_notValidFlasher();
      }
      _getFlashloan(vault, assets, debt, from, to, flasher, setToAsActiveProvider);
    }

    success = true;
  }

  /**
   * @notice Set `executor` as an authorized address for calling rebalancer operations
   * or remove authorization.
   * Requirement:
   * - Must be called from a timelock.
   * - Must emit a `AllowExecutor` event.
   *
   * @param executor address
   * @param allowed boolean
   */
  function allowExecutor(address executor, bool allowed) external onlyTimelock {
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
   * @param amount to be rebalanced to check against
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
   * @dev Checks this address is the flashloan originator.
   *
   * @param vault address being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from lending provider address
   * @param to lending provider address
   * @param flasher address used
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
   * @param vault address being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from lending provider address
   * @param to lending provider address
   * @param flasher address used
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
   * Requirements:
   * - Must check this address was the flashloan originator.
   * - Must clear the check state variable `_entryPoint`.
   *
   * @param vault address being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from lending provider address
   * @param to lending provider address
   * @param flasher address used
   * @param setToAsActiveProvider boolean to define `to` as active provider
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
    _checkReentry(vault, assets, debt, from, to, flasher, setToAsActiveProvider);

    IERC20 debtAsset = IERC20(vault.debtAsset());

    if (debtAsset.balanceOf(address(this)) != debt) {
      revert RebalancerManager__getFlashloan_flashloanFailed();
    }

    debtAsset.safeApprove(address(vault), debt);

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debt);

    vault.rebalance(assets, debt, from, to, flashloanFee, setToAsActiveProvider);

    debtAsset.safeTransfer(address(flasher), debt + flashloanFee);

    // re-init
    _entryPoint = "";
    success = true;
  }
}
