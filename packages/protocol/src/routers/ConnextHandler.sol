// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ConnextHandler
 *
 * @author Fujidao Labs
 *
 * @notice Handles failed transactions from Connext and keeps custody of
 * the transferred funds.
 */

import {ConnextRouter} from "./ConnextRouter.sol";
import {IRouter} from "../interfaces/IRouter.sol";
import {IVault} from "../interfaces/IVault.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract ConnextHandler {
  /**
   * @dev Contains the information of a failed transaction.
   */
  struct FailedTxn {
    bytes32 transferId;
    uint256 amount;
    address asset;
    address originSender;
    uint32 originDomain;
    IRouter.Action[] actions;
    bytes[] args;
  }

  /**
   * @dev Emitted when a failed transaction gets retried.
   *
   * @param transferId the unique identifier of the cross-chain txn
   * @param success boolean
   * @param oldArgs of the failed transaction
   * @param newArgs attemped in execution
   */
  event FailedTxnExecuted(
    bytes32 indexed transferId,
    bool indexed success,
    IRouter.Action[] oldActions,
    IRouter.Action[] newActions,
    bytes[] oldArgs,
    bytes[] newArgs
  );

  /// @dev Custom errors
  error ConnextHandler__callerNotConnextRouter();

  bytes32 private constant ZERO_BYTES32 =
    0x0000000000000000000000000000000000000000000000000000000000000000;

  ConnextRouter public immutable connextRouter;

  /// @dev Maps a failed transferId -> calldata
  mapping(bytes32 => FailedTxn) private _failedTxns;

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
    connextRouter = ConnextRouter(payable(connextRouter_));
  }

  /**
   * @notice Returns the struct of failed transaction by `transferId`.
   *
   * @param transferId the unique identifier of the cross-chain txn
   */
  function getFailedTransaction(bytes32 transferId) public view returns (FailedTxn memory) {
    return _failedTxns[transferId];
  }

  /**
   * @notice Returns the true if the failed transaction is already recorded.
   *
   * @param transferId the unique identifier of the cross-chain txn
   */
  function isTransferIdRecorded(bytes32 transferId) public view returns (bool) {
    FailedTxn memory ftxn = _failedTxns[transferId];
    if (ftxn.transferId != ZERO_BYTES32) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @notice Records a failed {ConnextRouter-xReceive} call.
   *
   * @param transferId the unique identifier of the cross-chain txn
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
    if (!isTransferIdRecorded(transferId)) {
      _failedTxns[transferId] =
        FailedTxn(transferId, amount, asset, originSender, originDomain, actions, args);
    }
  }

  /**
   * @notice Executes a failed transaction with update `args`
   *
   * @param transferId the unique identifier of the cross-chain txn
   * @param actions  that will replace actions of failed txn
   * @param args taht will replace args of failed txn
   *
   * @dev Requirements:
   * - Must only be called by an allowed caller in {ConnextRouter}.
   * - Must clear the txn from `_failedTxns` mapping if execution succeeds.
   * - Must replace `sender` in `args` for value tranfer type actions (Deposit-Payback-Swap}.
   */
  function executeFailedWithUpdatedArgs(
    bytes32 transferId,
    IRouter.Action[] memory actions,
    bytes[] memory args
  )
    external
    onlyAllowedCaller
  {
    FailedTxn memory txn = _failedTxns[transferId];
    IERC20(txn.asset).approve(address(connextRouter), txn.amount);
    try connextRouter.xBundle(txn.actions, args) {
      delete _failedTxns[transferId];
      emit FailedTxnExecuted(transferId, true, txn.actions, actions, txn.args, args);
    } catch {
      emit FailedTxnExecuted(transferId, false, txn.actions, actions, txn.args, args);
    }
  }
}
