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

  address public immutable treasury;

  //TODO check safety
  ISwapper public swapper;

  //keepers
  mapping(address => bool) public allowedExecutor;

  bytes32 private _entryPoint;

  constructor(address chief_, address treasury_, address swapper_) SystemAccessControl(chief_) {
    treasury = treasury_;
    swapper = ISwapper(swapper_);
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
    bool liquidatedUsers = false;

    for (uint256 i = 0; i < users.length; i++) {
      //check user's health before borrowing to avoid paying unecessary fees from flashloan
      if (vault.getHealthFactor(users[i]) < 1e18) {
        liquidatedUsers = true;
        //calculate how much to borrow from flasher
        uint256 liquidationFactor = vault.getLiquidationFactor(users[i]);

        //TODO check flashloan multiple calls reentry protection
        // if necessary, switch to calculate all users total debt and then flashloan once
        uint256 debtAmount = vault.balanceOfDebt(users[i]);
        uint256 debtToCover = Math.mulDiv(debtAmount, liquidationFactor, 1e18);
        _getFlashloan(vault, users[i], debtToCover, flasher);
      }
    }

    if (!liquidatedUsers) {
      revert LiquidationManager__liquidate_noUsersToLiquidate();
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
    IERC20 collateralAsset = IERC20(vault.asset());

    if (debtAsset.balanceOf(address(this)) != debtAmount) {
      revert LiquidationManager__getFlashloan_flashloanFailed();
    }

    debtAsset.safeApprove(address(vault), debtAmount);

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debtAmount);

    debtAsset.approve(address(vault), debtAmount);
    vault.liquidate(user, address(this));

    //save amount to send to treasury
    uint256 collateralAmount = vault.liquidate(user, address(this));

    //swap only the necessary amount to avoid paying unecessary fees
    uint256 amountIn =
      swapper.getAmountIn(address(collateralAsset), address(debtAsset), debtAmount + flashloanFee);
    swapper.swap(
      address(collateralAsset),
      address(debtAsset),
      amountIn,
      debtAmount + flashloanFee,
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
