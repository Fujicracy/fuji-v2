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
  error LiquidationManager__liquidate_arrayMismatch();
  error LiquidationManager__liquidate_notValidFlasher();
  error LiquidationManager__liquidate_notValidSwapper();

  uint256 private constant PRECISION_CONSTANT = 1e18;

  address public immutable treasury;

  /// @dev Keeper addresses allowed to liquidate via this manager.
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
    uint256[] calldata liqCloseFactors,
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

    uint256 ulen = users.length;
    if (ulen == 0 || ulen > 10) {
      revert LiquidationManager__liquidate_invalidNumberOfUsers();
    }
    if (ulen != liqCloseFactors.length) {
      revert LiquidationManager__liquidate_arrayMismatch();
    }

    _getFlashloan(users, liqCloseFactors, vault, debtToCover, flasher, swapper);
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
   * @param users to be liquidated
   * @param liqCloseFactors (optional) for each user, otherwise pass zero for each
   * @param vault that holds user's position
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   */
  function _checkReentry(
    address[] calldata users,
    uint256[] calldata liqCloseFactors,
    IVault vault,
    uint256 debtAmount,
    IFlasher flasher,
    ISwapper swapper
  )
    internal
    view
  {
    bytes memory requestorCalldata = abi.encodeWithSelector(
      LiquidationManager.completeLiquidation.selector,
      users,
      liqCloseFactors,
      vault,
      debtAmount,
      flasher,
      swapper
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
   * @param liqCloseFactors (optional) for each user, otherwise pass zero for each
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   */
  function _getFlashloan(
    address[] calldata users,
    uint256[] calldata liqCloseFactors,
    IVault vault,
    uint256 debtAmount,
    IFlasher flasher,
    ISwapper swapper
  )
    internal
  {
    bytes memory requestorCall = abi.encodeWithSelector(
      LiquidationManager.completeLiquidation.selector,
      users,
      liqCloseFactors,
      vault,
      debtAmount,
      flasher,
      swapper
    );

    _checkAndSetEntryPoint(requestorCall);

    address debtAsset = vault.debtAsset();

    flasher.initiateFlashloan(debtAsset, debtAmount, address(this), requestorCall);
  }

  /**
   * @notice Callback function that completes execution logic of a liquidation
   * operation with a flashloan.
   *
   * @param users to be liquidated
   * @param liqCloseFactors (optional) for each user, otherwise pass zero for each
   * @param vault that holds user's position*
   * @param debtAmount amount to liquidate
   * @param flasher contract address
   * @param swapper contract address
   *
   * @dev Requirements:
   * - Must check this address was the flashloan originator.
   * - Must clear the check state variable `_entryPoint`.
   */
  function completeLiquidation(
    address[] calldata users,
    uint256[] calldata liqCloseFactors,
    IVault vault,
    uint256 debtAmount,
    IFlasher flasher,
    ISwapper swapper
  )
    external
    returns (bool success)
  {
    _checkReentry(users, liqCloseFactors, vault, debtAmount, flasher, swapper);

    IERC20 debtAsset = IERC20(vault.debtAsset());
    IERC20 collateralAsset = IERC20(vault.asset());

    if (debtAsset.balanceOf(address(this)) < debtAmount) {
      revert LiquidationManager__getFlashloan_flashloanFailed();
    }

    // Approve amount to all liquidations
    debtAsset.safeIncreaseAllowance(address(vault), debtAmount);

    (bool liquidatedUsers, uint256 gainedShares) =
      _executeLiquidations(users, liqCloseFactors, vault);

    if (!liquidatedUsers) {
      revert LiquidationManager__liquidate_noUsersToLiquidate();
    }

    uint256 withdrawable = vault.convertToAssets(gainedShares);

    // Withdraw the "withdrawable" shares in exchange for collateralAsset
    vault.withdraw(withdrawable, address(this), address(this));

    uint256 flashloanFee = flasher.computeFlashloanFee(address(debtAsset), debtAmount);

    // Swap amount to payback the flashloan
    uint256 amountToSwap = debtAmount + flashloanFee - debtAsset.balanceOf(address(this));
    uint256 amountIn =
      swapper.getAmountIn(address(collateralAsset), address(debtAsset), amountToSwap);

    collateralAsset.safeIncreaseAllowance(address(swapper), amountIn);
    swapper.swap(
      address(collateralAsset),
      address(debtAsset),
      amountIn,
      amountToSwap,
      address(this),
      treasury,
      0
    );

    // Repay flashloan
    debtAsset.safeTransfer(address(flasher), debtAmount + flashloanFee);

    // Send the rest to treasury
    collateralAsset.safeTransfer(treasury, withdrawable - amountIn);

    // Re-initialize the `_entryPoint`.
    _entryPoint = "";
    success = true;
  }

  /**
   * @dev Internal function to loop and execute liquidations, returns true if a user was liquidated and the
   * total gainedShares.
   */
  function _executeLiquidations(
    address[] calldata users,
    uint256[] calldata liqCloseFactors,
    IVault vault
  )
    internal
    returns (bool liquidatedUsers, uint256 gainedShares)
  {
    for (uint256 i = 0; i < users.length; i++) {
      uint256 liqCloseFactor_ =
        liqCloseFactors[i] == 0 ? vault.getLiquidationFactor(users[i]) : liqCloseFactors[i];
      if (liqCloseFactor_ > 0) {
        // Ensure liqCloseFactor is not greater than PRECISION_CONSTANT
        liqCloseFactor_ =
          liqCloseFactor_ > PRECISION_CONSTANT ? PRECISION_CONSTANT : liqCloseFactor_;
        liquidatedUsers = true;
        gainedShares += vault.liquidate(users[i], address(this), liqCloseFactor_);
      }
    }
  }
}
