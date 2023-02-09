// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ConnextHandler
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
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract ConnextHandler {
  /**
   * @dev Contains the information of a failed Connext
   * failed transferId.
   */
  struct FailedTransfer {
    bytes32 transferId;
    address beneficiary;
    uint256 amount;
    address asset;
    address originSender;
    uint32 originDomain;
    IRouter.Action[] actions;
    bytes[] args;
  }

  /**
   * @dev Emit when calling `ExecutionFailed()` fails again.
   *
   * @param transferId the unique identifier of the crosschain transfer
   * @param success boolean
   * @param oldArgs of the failed transferId
   * @param newArgs attemped in execution
   */
  event RetryTransferId(
    bytes32 indexed transferId, bool indexed success, bytes[] oldArgs, bytes[] newArgs
  );

  /// @dev Custom errors
  error ConnextHandler__constructor_zeroAddress();
  error ConnextHandler__callerNotConnextRouter();

  ConnextRouter public immutable connextRouter;

  /// @dev Maps a failed transferId -> calldata
  mapping(bytes32 => FailedTransfer) private _failedTransfers;

  modifier onlyConnextRouter() {
    if (msg.sender != address(connextRouter)) {
      revert ConnextHandler__callerNotConnextRouter();
    }
    _;
  }

  /// @dev Modifier that checks `msg.sender` is an allowed called in {ConnextRouter}.
  modifier onlyAllowedCaller() {
    if (!connextRouter.isAllowedCaller(msg.sender)) {
      revert ConnextHandler__callerNotConnextRouter();
    }
    _;
  }

  /**
   * @notice Constructor that initialized
   */
  constructor(address connextRouter_) {
    if (address(connextRouter_) == address(0)) {
      revert ConnextHandler__constructor_zeroAddress();
    }
    connextRouter = ConnextRouter(payable(connextRouter_));
  }

  /**
   * @notice Returns the struct of failed `transferId`.
   *
   * @param transferId the unique identifier of the crosschain transfer
   */
  function getFailedTransfer(bytes32 transferId) public view returns (FailedTransfer memory) {
    return _failedTransfers[transferId];
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
    address beneficiary;
    (args[0], beneficiary) = _replaceSenderAndGetBeneficiary(actions[0], args[0]);

    _failedTransfers[transferId] = FailedTransfer(
      transferId, beneficiary, amount, asset, originSender, originDomain, actions, args
    );
  }

  /**
   * @notice Executes a failed transfer with update `args`
   *
   * @param transferId the unique identifier of the crosschain transfer
   *
   * @dev For security reasons only `args` in FailedTransfer can be updated with
   * the original intended `actions`.
   * Requirements:
   * - Must only be called by an allowed caller in {ConnextRouter}.
   * - Must clear the transfer from `_failedTransfers` mapping if execution succeeds.
   */
  function executeFailedWithUpdatedArgs(
    bytes32 transferId,
    bytes[] memory args_
  )
    external
    onlyAllowedCaller
  {
    FailedTransfer memory transfer = _failedTransfers[transferId];
    IERC20(transfer.asset).approve(address(connextRouter), transfer.amount);
    try connextRouter.xBundle(transfer.actions, args_) {
      delete _failedTransfers[transferId];
      emit RetryTransferId(transferId, true, transfer.args, args_);
    } catch {
      emit RetryTransferId(transferId, false, transfer.args, args_);
    }
  }

  /**
   * @dev Decodes and replaces "sender" argument in args with address(this)
   * in Deposit, Payback or Swap action.
   */
  function _replaceSenderAndGetBeneficiary(
    IRouter.Action action,
    bytes memory args
  )
    internal
    view
    returns (bytes memory newArgs, address beneficiary)
  {
    newArgs = args;

    // Check first action type and replace with slippage-amount.
    if (action == IRouter.Action.Deposit || action == IRouter.Action.Payback) {
      // For Deposit or Payback.
      (IVault vault, uint256 amount, address receiver, address sender) =
        abi.decode(args, (IVault, uint256, address, address));

      sender = address(this);
      beneficiary = receiver;
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
      beneficiary = receiver;
      newArgs = abi.encode(
        swapper, assetIn, assetOut, amountIn, amountOut, receiver, sweeper, minSweepOut, sender
      );
    }
  }
}
