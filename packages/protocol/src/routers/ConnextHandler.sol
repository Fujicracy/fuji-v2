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
    address beneficiary;
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
    bytes32 indexed transferId, bool indexed success, bytes[] oldArgs, bytes[] newArgs
  );

  /// @dev Custom errors
  error ConnextHandler__callerNotConnextRouter();

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
     * @dev Get address who claims ownership of the "value" in
     * the actions of this failed txn.
     */
    address beneficiary = _getBeneficiary(actions[0], args[0]);

    _failedTxns[transferId] =
      FailedTxn(transferId, beneficiary, amount, asset, originSender, originDomain, actions, args);
  }

  /**
   * @notice Executes a failed transaction with update `args`
   *
   * @param transferId the unique identifier of the cross-chain txn
   *
   * @dev For security reasons only `args` in FailedTxn can be updated with
   * the original intended `actions`.
   * Requirements:
   * - Must only be called by an allowed caller in {ConnextRouter}.
   * - Must clear the txn from `_failedTxns` mapping if execution succeeds.
   * - Must replace `sender` in `args` for value tranfer type actions (Deposit-Payback-Swap}.
   */
  function executeFailedWithUpdatedArgs(
    bytes32 transferId,
    bytes[] memory args
  )
    external
    onlyAllowedCaller
  {
    FailedTxn memory txn = _failedTxns[transferId];
    IERC20(txn.asset).approve(address(connextRouter), txn.amount);
    try connextRouter.xBundle(txn.actions, args) {
      delete _failedTxns[transferId];
      emit FailedTxnExecuted(transferId, true, txn.args, args);
    } catch {
      emit FailedTxnExecuted(transferId, false, txn.args, args);
    }
  }

  /**
   * @dev Returns address who claims ownership of the "value" in
   * the `action` of failed txn.
   */
  function _getBeneficiary(
    IRouter.Action action,
    bytes memory args
  )
    internal
    view
    returns (address beneficiary)
  {
    if (action == IRouter.Action.Deposit || action == IRouter.Action.Payback) {
      // For Deposit or Payback
      (,, address receiver,) = abi.decode(args, (IVault, uint256, address, address));

      beneficiary = receiver;
    } else if (action == IRouter.Action.PermitWithdraw || action == IRouter.Action.PermitBorrow) {}
    else if (action == IRouter.Action.Swap) {
      // For Swap we record who was the intended receiver
      (
        ISwapper swapper,
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 amountOut,
        address receiver,
        address sweeper,
      ) =
        abi.decode(args, (ISwapper, address, address, uint256, uint256, address, address, uint256));

      beneficiary = receiver;
    }
  }
}
