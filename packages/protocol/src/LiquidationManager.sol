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
  function liquidate(address[] memory users, IVault vault, IFlasher flasher) external {
    if (!allowedExecutor[msg.sender]) {
      revert LiquidationManager__liquidate_notValidExecutor();
    }

    uint256 collectedAmount;

    for (uint256 i = 0; i < users.length; i++) {
      //check user's health before borrowing to avoid paying unecessary fees from flashloan
      if (vault.getHealthFactor(users[i]) < 1e18) {
        //calculate how much to borrow from flasher
        uint256 liquidationFactor = vault.getLiquidationFactor(users[i]);
        uint256 debtAmount = vault.balanceOfDebt(users[i]);
        uint256 debtToCover = Math.mulDiv(debtAmount, liquidationFactor, 1e18);
        _getFlashloan(vault, users[i], debtAmount, flasher);
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
      revert LiquidationManager__getFlashloan_notEmptyEntryPoint();
    }
    _entryPoint = keccak256(abi.encode(requestorCall));
  }

  /**
   * @dev Checks this address is the flashloan originator. This check applies to a
   * {BorrowingVault} only.
   *
   * @param vault that holds user's position
   * @param user to be liquidated
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   */
  function _checkReentry(
    IVault vault,
    address user,
    uint256 debtAmount,
    IFlasher flasher
  )
    internal
    view
  {
    bytes memory requestorCalldata = abi.encodeWithSelector(
      LiquidationManager.completeLiquidation.selector, vault, user, debtAmount, flasher
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
   * @param user to be liquidated
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   */
  function _getFlashloan(IVault vault, address user, uint256 debtAmount, IFlasher flasher) internal {
    bytes memory requestorCall = abi.encodeWithSelector(
      LiquidationManager.completeLiquidation.selector, vault, user, debtAmount, flasher
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
   * @param user to be liquidated
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   *
   * @dev Requirements:
   * - Must check this address was the flashloan originator.
   * - Must clear the check state variable `_entryPoint`.
   */
  function completeLiquidation(
    IVault vault,
    address user,
    uint256 debtAmount,
    IFlasher flasher
  )
    external
    returns (bool success)
  {
    _checkReentry(vault, user, debtAmount, flasher);

    IERC20 debtAsset = IERC20(vault.debtAsset());

    if (debtAsset.balanceOf(address(this)) != debtAmount) {
      revert LiquidationManager__getFlashloan_flashloanFailed();
    }

    debtAsset.safeApprove(address(vault), debtAmount);

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debtAmount);

    vault.liquidate(user, address(this));

    //TODO

    uint256 collateralAmount = vault.liquidate(user, address(this));

    //swap collateralAsset to debtAsset

    //calc += collectedAmount

    //repay flashloan
    debtAsset.safeTransfer(address(flasher), debtAmount + flashloanFee);

    // Re-initialize the `_entryPoint`.
    _entryPoint = "";
    success = true;
  }

  /**
   * @notice Swaps a token for another one.
   *
   * @param originAsset the asset provided
   * @param destinationAsset the asset to be received
   *
   * @dev Used when liquidating someone to
   * swap the received collateralAsset to debtAsset to repay the flashloan
   *
   */
  function swap(address originAsset, address destinationAsset) internal {}
}
