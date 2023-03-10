// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title LiquidationManager
 *
 * @author Fujidao Labs
 *
 * @notice  Contract that facilitates liquidation of the FujiV2 vaults' users.
 */

import {ILiquidationManager} from "./interfaces/ILiquidationManager.sol";
import {IVault} from "./interfaces/IVault.sol";
import {IFlasher} from "./interfaces/IFlasher.sol";
import {ISwapper} from "./interfaces/ISwapper.sol";
import {SystemAccessControl} from "./access/SystemAccessControl.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidationManager is ILiquidationManager, SystemAccessControl {
  using SafeERC20 for IERC20;
  using Math for uint256;

  /// @dev Custom errors
  error LiquidationManager__allowExecutor_noAllowChange();
  error LiquidationManager__zeroAddress();
  error LiquidationManager__getFlashloan_flashloanFailed();
  error LiquidationManager__completeLiquidation_invalidEntryPoint();
  error LiquidationManager__getFlashloan_notEmptyEntryPoint();
  error LiquidationManager__liquidate_notValidExecutor();
  error LiquidationManager__liquidate_noUsersToLiquidate();
  error LiquidationManager__liquidate_invalidNumberOfUsers();
  error LiquidationManager__liquidate_notValidFlasher();
  error LiquidationManager__liquidate_notValidSwapper();

  address public immutable treasury;

  //keepers
  mapping(address => bool) public allowedExecutor;

  bytes32 private _entryPoint;

  constructor(address chief_, address treasury_) SystemAccessControl(chief_) {
    treasury = treasury_;
  }

  /// @inheritdoc ILiquidationManager
  function allowExecutor(address executor, bool allowed) external override onlyTimelock {
    if (executor == address(0)) {
      revert LiquidationManager__zeroAddress();
    }
    if (allowedExecutor[executor] == allowed) {
      revert LiquidationManager__allowExecutor_noAllowChange();
    }
    allowedExecutor[executor] = allowed;
    emit AllowExecutor(executor, allowed);
  }

  /// @inheritdoc ILiquidationManager
  function liquidate(
    address[] calldata users,
    IVault vault,
    uint256 debtToCover,
    IFlasher flasher,
    ISwapper swapper
  )
    external
  {
    if (!allowedExecutor[msg.sender]) {
      revert LiquidationManager__liquidate_notValidExecutor();
    }
    if (!chief.allowedFlasher(address(flasher))) {
      revert LiquidationManager__liquidate_notValidFlasher();
    }
    if (!chief.allowedSwapper(address(swapper))) {
      revert LiquidationManager__liquidate_notValidSwapper();
    }

    if (users.length == 0 || users.length > 10) {
      revert LiquidationManager__liquidate_invalidNumberOfUsers();
    }

    _getFlashloan(users, vault, debtToCover, flasher, swapper);
  }

  /**
   * @dev Sets a checkpoint for this address as the flashloan originator.
   *
   * @param requestorCall bytes sent to flashloan provider
   */
  function _checkAndSetEntryPoint(bytes memory requestorCall) internal {
    if (_entryPoint != "") {
      revert LiquidationManager__getFlashloan_notEmptyEntryPoint();
    }
    _entryPoint = keccak256(abi.encode(requestorCall));
  }

  /**
   * @dev Checks this address is the flashloan originator. This check applies to a
   * {BorrowingVault} only.
   *
   * @param vault that holds user's position
   * @param users to be liquidated
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   */
  function _checkReentry(
    address[] calldata users,
    IVault vault,
    uint256 debtAmount,
    IFlasher flasher,
    ISwapper swapper
  )
    internal
    view
  {
    bytes memory requestorCalldata = abi.encodeWithSelector(
      LiquidationManager.completeLiquidation.selector, users, vault, debtAmount, flasher, swapper
    );
    bytes32 hashCheck = keccak256(abi.encode(requestorCalldata));
    if (_entryPoint != hashCheck) {
      revert LiquidationManager__completeLiquidation_invalidEntryPoint();
    }
  }

  /**
   * @dev Initiates flashloan for a liquidation operation.
   *
   * @param vault that holds user's position
   * @param users to be liquidated
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   */
  function _getFlashloan(
    address[] calldata users,
    IVault vault,
    uint256 debtAmount,
    IFlasher flasher,
    ISwapper swapper
  )
    internal
  {
    bytes memory requestorCall = abi.encodeWithSelector(
      LiquidationManager.completeLiquidation.selector, users, vault, debtAmount, flasher, swapper
    );

    _checkAndSetEntryPoint(requestorCall);

    address debtAsset = vault.debtAsset();

    flasher.initiateFlashloan(debtAsset, debtAmount, address(this), requestorCall);
  }

  /**
   * @notice Callback function that completes execution logic of a liquidation
   * operation with a flashloan.
   *
   * @param vault that holds user's position
   * @param users to be liquidated
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   *
   * @dev Requirements:
   * - Must check this address was the flashloan originator.
   * - Must clear the check state variable `_entryPoint`.
   */
  function completeLiquidation(
    address[] calldata users,
    IVault vault,
    uint256 debtAmount,
    IFlasher flasher,
    ISwapper swapper
  )
    external
    returns (bool success)
  {
    _checkReentry(users, vault, debtAmount, flasher, swapper);

    IERC20 debtAsset = IERC20(vault.debtAsset());
    IERC20 collateralAsset = IERC20(vault.asset());

    if (debtAsset.balanceOf(address(this)) != debtAmount) {
      revert LiquidationManager__getFlashloan_flashloanFailed();
    }

    //approve amount to all liquidations
    debtAsset.safeApprove(address(vault), debtAmount);

    bool liquidatedUsers = false;

    uint256 collateralAmount = 0;

    for (uint256 i = 0; i < users.length; i++) {
      if (vault.getHealthFactor(users[i]) < 1e18) {
        liquidatedUsers = true;
        collateralAmount += vault.liquidate(users[i], address(this));
      }
    }

    if (!liquidatedUsers) {
      revert LiquidationManager__liquidate_noUsersToLiquidate();
    }

    uint256 maxWithdrawAmount = vault.maxWithdraw(address(this));

    //TODO check this condition after precision in vault is fixed
    if (collateralAmount > maxWithdrawAmount) {
      collateralAmount = maxWithdrawAmount;
    }

    //sell shares for collateralAsset
    vault.withdraw(collateralAmount, address(this), address(this));

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debtAmount);

    //swap amount to payback the flashloan
    uint256 amountToSwap = debtAmount + flashloanFee - debtAsset.balanceOf(address(this));
    uint256 amountIn =
      swapper.getAmountIn(address(collateralAsset), address(debtAsset), amountToSwap);

    collateralAsset.safeApprove(address(swapper), amountIn);
    swapper.swap(
      address(collateralAsset),
      address(debtAsset),
      amountIn,
      amountToSwap,
      address(this),
      treasury,
      0
    );

    //repay flashloan
    debtAsset.safeTransfer(address(flasher), debtAmount + flashloanFee);

    //send the rest to treasury
    collateralAsset.safeTransfer(treasury, collateralAmount - amountIn);

    // Re-initialize the `_entryPoint`.
    _entryPoint = "";
    success = true;
  }
}
