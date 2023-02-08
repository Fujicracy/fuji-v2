// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ConnextHelperReceiver
 *
 * @author Fujidao Labs
 *
 * @notice Handles failed transfers from Connext and keeps custody of
 * the transferred funds.
 */

import {ConnextRouter} from "./ConnextRouter.sol";
import {IRouter} from "../interfaces/IRouter.sol";
import {IVault} from "../interfaces/IVault.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";

contract ConnextHelperReceiver {
  /**
   * @dev Contains an address of an ERC-20 and the balance the router holds
   * at a given moment of the transaction (ref. `_tokensToCheck`).
   */
  struct FailedTransfer {
    bytes32 id;
    uint256 amount;
    address asset;
    address originSender;
    uint32 originDomain;
    // actions = abi.encoded(IRouter.Action[], bytes[])
    bytes data;
  }

  /**
   * @dev Emit when calling `ExecutionFailed()` fails again.
   */
  event Failed(bytes32 transferId);

  /// @dev Custom errors
  error ConnextHelperReceiver__constructor_zeroAddress();
  error ConnextHelperReceiver__callerNotConnextRouter();

  ConnextRouter public immutable connextRouter;

  /// @dev Maps a failed transferId -> calldata
  mapping(bytes32 => FailedTransfer) public failedTransfers;

  modifier onlyConnextRouter() {
    if (msg.sender != address(connextRouter)) {
      revert ConnextHelperReceiver__callerNotConnextRouter();
    }
    _;
  }

  modifier allowedCallerInConnextRouter() {
    if (!connextRouter.isAllowedCaller(msg.sender)) {
      revert ConnextHelperReceiver__callerNotConnextRouter();
    }
    _;
  }

  constructor(address connextRouter_) {
    if (address(connextRouter_) == address(0)) {
      revert ConnextHelperReceiver__constructor_zeroAddress();
    }
    connextRouter = ConnextRouter(payable(connextRouter_));
  }

  /**
   * @notice Records a failed {ConnextRouter-xReceive} call.
   *
   * @param transferId the unique identifier of the crosschain transfer
   * @param amount the amount of transferring asset, after slippage, the recipient address receives
   * @param asset the asset being transferred
   * @param originSender the address of the contract or EOA that called xcall on the origin chain
   * @param originDomain the origin domain identifier according Connext nomenclature
   * @param actions that should be executed in {BaseRouter-internalBundle}
   * @param args for the actions
   *
   * @dev At this point of execution {ConnextRouter} sent all balance of `asset` to this contract.
   * It has already been verified that `amount` of `asset` is >= to balance sent.
   * This function does not need to emit an event since {ConnextRouter} already emit
   * a failed `XReceived` event.
   *
   * Requirements:
   * - Must replace `sender` in args for value tranfer type (Deposit-Payback-Swap) `actions`.
   */
  function recordFailed(
    bytes32 transferId,
    uint256 amount,
    address asset,
    address originSender,
    uint32 originDomain,
    IRouter.Action[] memory actions,
    bytes[] memory args
  )
    external
    onlyConnextRouter
  {
    /**
     * @dev Since execution of this failed transfer will happen from this
     * address, if the first action is of value transfer type, sender
     * argument must be replaced.
     */
    args[0] = _replaceSender(actions[0], args[0]);

    bytes memory data = abi.encode(actions, args);
    failedTransfers[transferId] =
      FailedTransfer(transferId, amount, asset, originSender, originDomain, data);
  }

  function executeFailed(bytes32 transferId) external allowedCallerInConnextRouter {
    FailedTransfer memory transfer = failedTransfers[transferId];
    (IRouter.Action[] memory actions, bytes[] memory args) =
      abi.decode(transfer.data, (IRouter.Action[], bytes[]));
    try connextRouter.xBundle(actions, args) {
      delete failedTransfers[transferId];
    } catch {
      emit Failed(transferId);
    }
  }

  /**
   * @dev Decodes and replaces "sender" argument in args with address(this)
   * in Deposit, Payback or Swap action.
   */
  function _replaceSender(
    IRouter.Action action,
    bytes memory args
  )
    internal
    view
    returns (bytes memory newArgs)
  {
    newArgs = args;

    // Check first action type and replace with slippage-amount.
    if (action == IRouter.Action.Deposit || action == IRouter.Action.Payback) {
      // For Deposit or Payback.
      (IVault vault, uint256 amount, address receiver, address sender) =
        abi.decode(args, (IVault, uint256, address, address));

      sender = address(this);
      newArgs = abi.encode(vault, amount, receiver, sender);
    } else if (action == IRouter.Action.Swap) {
      // For Swap.
      (
        ISwapper swapper,
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 amountOut,
        address receiver,
        address sweeper,
        uint256 minSweepOut,
        address sender
      ) = abi.decode(
        args, (ISwapper, address, address, uint256, uint256, address, address, uint256, address)
      );

      sender = address(this);
      newArgs = abi.encode(
        swapper, assetIn, assetOut, amountIn, amountOut, receiver, sweeper, minSweepOut, sender
      );
    }
  }
}
