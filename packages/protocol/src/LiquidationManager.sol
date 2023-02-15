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
// import {IFlasher} from "./interfaces/IFlasher.sol";
import {SystemAccessControl} from "./access/SystemAccessControl.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidationManager is ILiquidationManager, SystemAccessControl {
  using SafeERC20 for IERC20;

  /// @dev Custom errors
  error LiquidationManager__allowExecutor_noAllowChange();
  error LiquidationManager__zeroAddress();

  address public immutable treasury;

  //keepers
  mapping(address => bool) public allowedExecutor;

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
  function liquidate(address[] memory users, IVault vault) external {}

  /// @inheritdoc ILiquidationManager
  function swap(address originAsset, address destinationAsset) external {}
}
