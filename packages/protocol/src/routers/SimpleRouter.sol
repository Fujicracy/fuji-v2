// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title SimpleRouter
 *
 * @author Fujidao Labs
 *
 * @notice A Router contract without any bridging logic.
 * It facilitates tx bundling meant to be executed on a single chain.
 */

import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9} from "../abstracts/WETH9.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";
import {IChief} from "../interfaces/IChief.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {LibBytes} from "../libraries/LibBytes.sol";

contract SimpleRouter is BaseRouter {
  /// @dev Custom Errors
  error SimpleRouter__noCrossTransfersImplemented();

  constructor(IWETH9 weth, IChief chief) BaseRouter(weth, chief) {}

  /// @inheritdoc BaseRouter
  function _crossTransfer(bytes memory, address) internal pure override returns (address) {
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  /// @inheritdoc BaseRouter
  function _crossTransferWithCalldata(
    bytes memory,
    address
  )
    internal
    pure
    override
    returns (address)
  {
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  /// @inheritdoc BaseRouter
  function _replaceAmountInCrossAction(
    Action,
    bytes memory,
    uint256
  )
    internal
    pure
    override
    returns (bytes memory, uint256)
  {
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  /// @inheritdoc BaseRouter
  function _getBeneficiaryFromCalldata(
    Action[] memory actions,
    bytes[] memory args
  )
    internal
    view
    override
    returns (address beneficiary_)
  {
    if (actions[0] == Action.Deposit || actions[0] == Action.Payback) {
      // For Deposit or Payback.
      (,, address receiver,) = abi.decode(args[0], (IVault, uint256, address, address));
      beneficiary_ = receiver;
    } else if (actions[0] == Action.Withdraw || actions[0] == Action.Borrow) {
      // For Withdraw or Borrow
      (,,, address owner) = abi.decode(args[0], (IVault, uint256, address, address));
      beneficiary_ = owner;
    } else if (actions[0] == Action.WithdrawETH) {
      // For WithdrawEth
      (, address receiver) = abi.decode(args[0], (uint256, address));
      beneficiary_ = receiver;
    } else if (actions[0] == Action.PermitBorrow || actions[0] == Action.PermitWithdraw) {
      (, address owner,,,,,,) = abi.decode(
        args[0], (IVaultPermissions, address, address, uint256, uint256, uint8, bytes32, bytes32)
      );
      beneficiary_ = owner;
    } else if (actions[0] == Action.Flashloan) {
      (,,,, bytes memory requestorCalldata) =
        abi.decode(args[0], (IFlasher, address, uint256, address, bytes));

      (Action[] memory newActions, bytes[] memory newArgs) = abi.decode(
        LibBytes.slice(requestorCalldata, 4, requestorCalldata.length - 4), (Action[], bytes[])
      );

      beneficiary_ = _getBeneficiaryFromCalldata(newActions, newArgs);
    } else if (actions[0] == Action.DepositETH) {
      /// @dev DepositETH cannot be actions[0] in inner-flashloan actions.
      revert BaseRouter__bundleInternal_notFirstAction();
    } else if (actions[0] == Action.XTransfer) {
      /// @dev SimpleRouter does not implement cross chain txs.
      revert SimpleRouter__noCrossTransfersImplemented();
    } else if (actions[0] == Action.XTransferWithCall) {
      /// @dev SimpleRouter does not implement cross chain txs.
      revert SimpleRouter__noCrossTransfersImplemented();
    } else if (actions[0] == Action.Swap) {
      /// @dev swap cannot be actions[0].
      revert BaseRouter__bundleInternal_notFirstAction();
    }
  }
}
