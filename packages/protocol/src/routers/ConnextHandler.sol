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
import {IERC20, SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

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
    uint128 nonce;
    bool executed;
  }

  /**
   * @dev Emitted when a failed transaction is recorded.
   *
   * @param transferId  unique id of the cross-chain txn
   * @param amount transferred
   * @param asset being transferred
   * @param originSender of the cross-chain txn
   * @param originDomain of the cross-chain txn
   * @param actions to be called in xBundle
   * @param args to be called for each action in xBundle
   * @param nonce of failed txn
   */
  event FailedTxnRecorded(
    bytes32 indexed transferId,
    uint256 amount,
    address asset,
    address originSender,
    uint32 originDomain,
    IRouter.Action[] actions,
    bytes[] args,
    uint128 nonce
  );

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
    IRouter.Action[] oldActions,
    IRouter.Action[] newActions,
    bytes[] oldArgs,
    bytes[] newArgs,
    uint128 nonce,
    bool indexed success
  );

  /// @dev Custom errors
  error ConnextHandler__callerNotConnextRouter();
  error ConnextHandler__executeFailed_emptyTxn();
  error ConnextHandler__executeFailed_tranferAlreadyExecuted(bytes32 transferId, uint128 nonce);

  bytes32 private constant ZERO_BYTES32 =
    0x0000000000000000000000000000000000000000000000000000000000000000;

  ConnextRouter public immutable connextRouter;

  /**
   * @dev Maps a failed transferId -> nonce -> calldata
   * Multiple failed attempts are registered with nonce
   */
  mapping(bytes32 => mapping(uint256 => FailedTxn)) private _failedTxns;

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
   * @param nonce attempt of failed tx
   */
  function getFailedTxn(bytes32 transferId, uint128 nonce) public view returns (FailedTxn memory) {
    return _failedTxns[transferId][nonce];
  }

  function getFailedTxnNextNonce(bytes32 transferId) public view returns (uint128 next) {
    next = 0;
    for (uint256 i; i < type(uint8).max;) {
      if (!isTransferIdRecorded(transferId, uint128(i))) {
        next = uint128(i);
        break;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @notice Returns the true if the failed transaction is already recorded.
   *
   * @param transferId the unique identifier of the cross-chain txn
   */
  function isTransferIdRecorded(bytes32 transferId, uint128 nonce) public view returns (bool) {
    FailedTxn memory ftxn = _failedTxns[transferId][nonce];
    if (ftxn.transferId != ZERO_BYTES32 && ftxn.originDomain != 0) {
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
    uint128 nextNonce = getFailedTxnNextNonce(transferId);
    _failedTxns[transferId][nextNonce] = FailedTxn(
      transferId, amount, asset, originSender, originDomain, actions, args, nextNonce, false
    );

    emit FailedTxnRecorded(
      transferId, amount, asset, originSender, originDomain, actions, args, nextNonce
    );
  }

  /**
   * @notice Executes a failed transaction with update `args`
   *
   * @param transferId the unique identifier of the cross-chain txn
   * @param nonce of the failed attempt to execute
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
    uint128 nonce,
    IRouter.Action[] memory actions,
    bytes[] memory args
  )
    external
    onlyAllowedCaller
  {
    FailedTxn memory txn = _failedTxns[transferId][nonce];

    if (txn.transferId == ZERO_BYTES32 || txn.originDomain == 0) {
      revert ConnextHandler__executeFailed_emptyTxn();
    } else if (txn.executed) {
      revert ConnextHandler__executeFailed_tranferAlreadyExecuted(transferId, nonce);
    }

    SafeERC20.safeIncreaseAllowance(IERC20(txn.asset), address(connextRouter), txn.amount);

    try connextRouter.xBundle(actions, args) {
      txn.executed = true;
      _failedTxns[transferId][nonce] = txn;
      emit FailedTxnExecuted(transferId, txn.actions, actions, txn.args, args, nonce, true);
    } catch {
      SafeERC20.safeDecreaseAllowance(IERC20(txn.asset), address(connextRouter), txn.amount);
      emit FailedTxnExecuted(transferId, txn.actions, actions, txn.args, args, nonce, false);
    }
  }
}
