import { Values, NxtpError } from "@connext/nxtp-utils";
import { providers } from "ethers";
import { Logger } from "ethers/lib/utils";

export class MaxBufferLengthError extends NxtpError {
  /**
   * Thrown if a backfill transaction fails and other txs are attempted
   */
  static readonly type = MaxBufferLengthError.name;

  constructor(public readonly context: any = {}) {
    super("Inflight transaction buffer is full.", context, MaxBufferLengthError.type);
  }
}

export class StallTimeout extends NxtpError {
  static readonly type = StallTimeout.name;

  constructor(public readonly context: any = {}) {
    super("Request stalled and timed out.", context, StallTimeout.type);
  }
}

export class RpcError extends NxtpError {
  static readonly type = RpcError.name;

  /**
   * Indicates the RPC Providers are malfunctioning. If errors of this type persist,
   * ensure you have a sufficient number of backup providers configured.
   */
  static readonly reasons = {
    OutOfSync: "All providers for this chain fell out of sync with the chain.",
    FailedToSend: "Failed to send RPC transaction.",
    NetworkError: "An RPC network error occurred.",
    ConnectionReset: "Connection was reset by peer.",
  };

  constructor(public readonly reason: Values<typeof RpcError.reasons>, public readonly context: any = {}) {
    super(reason, context, RpcError.type);
  }
}

export class TransactionReadError extends NxtpError {
  /**
   * An error that indicates that a read transaction failed.
   */
  static readonly type = TransactionReadError.name;

  static readonly reasons = {
    ContractReadError: "An exception occurred while trying to read from the contract.",
  };

  constructor(public readonly reason: Values<typeof TransactionReverted.reasons>, public readonly context: any = {}) {
    super(reason, context, TransactionReadError.type);
  }
}

export class TransactionReverted extends NxtpError {
  /**
   * An error that indicates that the transaction was reverted on-chain.
   *
   * Could be harmless if this was from a subsuquent attempt, e.g. if the tx
   * was already mined (NonceExpired, AlreadyMined)
   *
   * Alternatively, if this is from the first attempt, it must be thrown as the reversion
   * was for a legitimate reason.
   */
  static readonly type = TransactionReverted.name;

  static readonly reasons = {
    GasEstimateFailed: "Operation for gas estimate failed; transaction was reverted on-chain.",
    InsufficientFunds: "Not enough funds in wallet.",
    /**
     * From ethers docs:
     * If the transaction execution failed (i.e. the receipt status is 0), a CALL_EXCEPTION error will be rejected with the following properties:
     * error.transaction - the original transaction
     * error.transactionHash - the hash of the transaction
     * error.receipt - the actual receipt, with the status of 0
     */
    CallException: "An exception occurred during this contract call.",
    /**
     * No difference between the following two errors, except to distinguish a message we
     * get back from providers on execution failure.
     */
    ExecutionFailed: "Transaction would fail on chain.",
    AlwaysFailingTransaction: "Transaction would always fail on chain.",
    GasExceedsAllowance: "Transaction gas exceeds allowance.",
  };

  constructor(
    public readonly reason: Values<typeof TransactionReverted.reasons>,
    public readonly receipt?: providers.TransactionReceipt,
    public readonly context: any = {},
  ) {
    super(reason, context, TransactionReverted.type);
  }
}

export class TransactionReplaced extends NxtpError {
  /**
   * From ethers docs:
   * If the transaction is replaced by another transaction, a TRANSACTION_REPLACED error will be rejected with the following properties:
   * error.hash - the hash of the original transaction which was replaced
   * error.reason - a string reason; one of "repriced", "cancelled" or "replaced"
   * error.cancelled - a boolean; a "repriced" transaction is not considered cancelled, but "cancelled" and "replaced" are
   * error.replacement - the replacement transaction (a TransactionResponse)
   * error.receipt - the receipt of the replacement transaction (a TransactionReceipt)
   */
  static readonly type = TransactionReplaced.name;

  constructor(
    public readonly receipt: providers.TransactionReceipt,
    public readonly replacement: providers.TransactionResponse,
    public readonly context: any = {},
  ) {
    super("Transaction replaced.", context, TransactionReplaced.type);
  }
}

// TODO: #144 Some of these error classes are a bit of an antipattern with the whole "reason" argument structure
// being missing. They won't function as proper NxtpErrors, essentially.
export class OperationTimeout extends NxtpError {
  /**
   * An error indicating that an operation (typically confirmation) timed out.
   */
  static readonly type = OperationTimeout.name;

  constructor(public readonly context: any = {}) {
    super("Operation timed out.", context, OperationTimeout.type);
  }
}

export class TransactionBackfilled extends NxtpError {
  /**
   * An error indicating that a transaction was replaced by a backfill, likely because it
   * was unresponsive.
   */
  static readonly type = TransactionBackfilled.name;

  constructor(public readonly context: any = {}) {
    super("Transaction was replaced by a backfill.", context, TransactionBackfilled.type);
  }
}

export class UnpredictableGasLimit extends NxtpError {
  /**
   * An error that we get back from ethers when we try to do a gas estimate, but this
   * may need to be handled differently.
   */
  static readonly type = UnpredictableGasLimit.name;

  constructor(public readonly context: any = {}) {
    super("The gas estimate could not be determined.", context, UnpredictableGasLimit.type);
  }
}

export class BadNonce extends NxtpError {
  /**
   * An error indicating that we got a "nonce expired"-like message back from
   * ethers while conducting sendTransaction.
   */
  static readonly type = BadNonce.name;

  static readonly reasons = {
    NonceExpired: "Nonce for this transaction is already expired.",
    ReplacementUnderpriced:
      "Gas for replacement tx was insufficient (must be greater than previous transaction's gas).",
    NonceIncorrect: "Transaction doesn't have the correct nonce",
  };

  constructor(public readonly reason: Values<typeof BadNonce.reasons>, public readonly context: any = {}) {
    super(reason, context, BadNonce.type);
  }
}

export class ServerError extends NxtpError {
  /**
   * An error indicating that an operation on the node server (such as validation
   * before submitting a transaction) occurred.
   *
   * This error could directly come from geth, or be altered by the node server,
   * depending on which service is used. As a result, we coerce this to a single error
   * type.
   */
  static readonly type = ServerError.name;

  static readonly reasons = {
    BadResponse: "Received bad response from provider.",
  };

  constructor(public readonly reason?: Values<typeof ServerError.reasons>, public readonly context: any = {}) {
    super(reason ?? "Server error occurred.", context, ServerError.type);
  }
}

export class TransactionAlreadyKnown extends NxtpError {
  /**
   * This one occurs (usually) when we try to send a transaction to multiple providers
   * and one or more of them already has the transaction in their mempool.
   */
  static readonly type = TransactionAlreadyKnown.name;

  constructor(public readonly context: any = {}) {
    super("Transaction is already indexed by provider.", context, TransactionAlreadyKnown.type);
  }
}

export class TransactionKilled extends NxtpError {
  /**
   * An error indicating that the transaction was killed by the monitor loop due to
   * it taking too long, and blocking (potentially too many) transactions in the pending
   * queue.
   *
   * It will be replaced with a backfill transaction at max gas.
   */
  static readonly type = TransactionKilled.name;

  constructor(public readonly context: any = {}) {
    super("Transaction was killed by monitor loop.", context, TransactionKilled.type);
  }
}

export class MaxAttemptsReached extends NxtpError {
  static readonly type = MaxAttemptsReached.name;

  static getMessage(attempts: number): string {
    return `Reached maximum attempts ${attempts}.`;
  }

  constructor(attempts: number, public readonly context: any = {}) {
    super(MaxAttemptsReached.getMessage(attempts), context, MaxAttemptsReached.type);
  }
}

export class NotEnoughConfirmations extends NxtpError {
  static readonly type = NotEnoughConfirmations.name;

  static getMessage(required: number, hash: string, confs: number): string {
    return `Never reached the required amount of confirmations (${required}) on ${hash} (got: ${confs}). Did a reorg occur?`;
  }

  constructor(required: number, hash: string, confs: number, public readonly context: any = {}) {
    super(NotEnoughConfirmations.getMessage(required, hash, confs), context, NotEnoughConfirmations.type);
  }
}

export class GasEstimateInvalid extends NxtpError {
  static readonly type = GasEstimateInvalid.name;

  static getMessage(returned: string): string {
    return `The gas estimate returned was an invalid value. Got: ${returned}`;
  }

  constructor(returned: string, public readonly context: any = {}) {
    super(GasEstimateInvalid.getMessage(returned), context, GasEstimateInvalid.type);
  }
}

export class ChainNotSupported extends NxtpError {
  static readonly type = ChainNotSupported.name;

  static getMessage(chainId: string): string {
    return `Request for chain ${chainId} cannot be handled: resources not configured.`;
  }

  constructor(public readonly chainId: string, public readonly context: any = {}) {
    super(ChainNotSupported.getMessage(chainId), context, ChainNotSupported.type);
  }
}

// TODO: ProviderNotConfigured is essentially a more specific ChainNotSupported error. Should they be combined?
export class ProviderNotConfigured extends NxtpError {
  static readonly type = ProviderNotConfigured.name;

  static getMessage(chainId: string): string {
    return `No provider(s) configured for chain ${chainId}. Make sure this chain's providers are configured.`;
  }

  constructor(public readonly chainId: string, public readonly context: any = {}) {
    super(ProviderNotConfigured.getMessage(chainId), context, ProviderNotConfigured.type);
  }
}

export class ConfigurationError extends NxtpError {
  static readonly type = ConfigurationError.name;

  constructor(
    public readonly invalidParameters: { parameter: string; error: string; value: any }[],
    public readonly context: any = {},
  ) {
    super("Configuration paramater(s) were invalid.", { ...context, invalidParameters }, ConfigurationError.type);
  }
}

export class InitialSubmitFailure extends NxtpError {
  static readonly type = InitialSubmitFailure.name;

  constructor(public readonly context: any = {}) {
    super(
      "Transaction never submitted: exceeded maximum iterations in initial submit loop.",
      context,
      InitialSubmitFailure.type,
    );
  }
}

// These errors should essentially never happen; they are only used within the block of sanity checks.
export class TransactionProcessingError extends NxtpError {
  static readonly type = TransactionProcessingError.name;

  static readonly reasons = {
    SubmitOutOfOrder: "Submit was called but transaction is already completed.",
    MineOutOfOrder: "Transaction mine or confirm was called, but no transaction has been sent.",
    ConfirmOutOfOrder: "Tried to confirm but tansaction did not complete 'mine' step; no receipt was found.",
    DuplicateHash: "Received a transaction response with a duplicate hash!",
    NoReceipt: "No receipt was returned from the transaction.",
    NullReceipt: "Unable to obtain receipt: ethers responded with null.",
    ReplacedButNoReplacement: "Transaction was replaced, but no replacement transaction and/or receipt was returned.",
    DidNotThrowRevert: "Transaction was reverted but TransactionReverted error was not thrown.",
    InsufficientConfirmations: "Receipt did not have enough confirmations, should have timed out!",
  };

  constructor(
    public readonly reason: Values<typeof TransactionProcessingError.reasons>,
    public readonly method: string,
    public readonly context: any = {},
  ) {
    super(
      reason,
      {
        ...context,
        method,
      },
      TransactionProcessingError.type,
    );
  }
}

/**
 * Parses error strings into strongly typed NxtpError.
 * @param error from ethers.js package
 * @returns NxtpError
 */
export const parseError = (error: any): NxtpError => {
  if (error.isNxtpError) {
    // If the error has already been parsed into a native error, just return it.
    return error;
  }

  let message = error.message;
  if (error.error && typeof error.error.message === "string") {
    message = error.error.message;
  } else if (typeof error.body === "string") {
    message = error.body;
  } else if (typeof error.responseText === "string") {
    message = error.responseText;
  }
  // Preserve the original message before making it lower case.
  const originalMessage = message;
  message = (message || "").toLowerCase();
  const context = {
    message: originalMessage,
    chainError: { code: error.code, reason: error.reason, data: error.error ? error.error.data : "n/a" },
  };

  if (message.match(/execution reverted/)) {
    return new TransactionReverted(TransactionReverted.reasons.ExecutionFailed, undefined, context);
  } else if (message.match(/always failing transaction/)) {
    return new TransactionReverted(TransactionReverted.reasons.AlwaysFailingTransaction, undefined, context);
  } else if (message.match(/gas required exceeds allowance/)) {
    return new TransactionReverted(TransactionReverted.reasons.GasExceedsAllowance, undefined, context);
  } else if (
    message.match(
      /another transaction with same nonce|same hash was already imported|transaction nonce is too low|nonce too low|oldnonce/,
    )
  ) {
    return new BadNonce(BadNonce.reasons.NonceExpired, context);
  } else if (message.match(/replacement transaction underpriced/)) {
    return new BadNonce(BadNonce.reasons.ReplacementUnderpriced, context);
  } else if (message.match(/tx doesn't have the correct nonce|invalid transaction nonce/)) {
    return new BadNonce(BadNonce.reasons.NonceIncorrect, context);
  } else if (message.match(/econnreset|eaddrinuse|econnrefused|epipe|enotfound|enetunreach|eai_again/)) {
    // Common connection errors: ECONNRESET, EADDRINUSE, ECONNREFUSED, EPIPE, ENOTFOUND, ENETUNREACH, EAI_AGAIN
    // TODO: Should also take in certain HTTP Status Codes: 429, 500, 502, 503, 504, 521, 522, 524; but need to be sure they
    // are status codes and not just part of a hash string, id number, etc.
    return new RpcError(RpcError.reasons.ConnectionReset, context);
  } else if (message.match(/already known|alreadyknown/)) {
    return new TransactionAlreadyKnown(context);
  } else if (message.match(/insufficient funds/)) {
    return new TransactionReverted(
      TransactionReverted.reasons.InsufficientFunds,
      error.receipt as providers.TransactionReceipt,
      context,
    );
  }

  switch (error.code) {
    case Logger.errors.TRANSACTION_REPLACED:
      return new TransactionReplaced(
        error.receipt as providers.TransactionReceipt,
        error.replacement as providers.TransactionResponse,
        {
          ...context,
          hash: error.hash,
          reason: error.reason,
          cancelled: error.cancelled,
        },
      );
    case Logger.errors.INSUFFICIENT_FUNDS:
      return new TransactionReverted(
        TransactionReverted.reasons.InsufficientFunds,
        error.receipt as providers.TransactionReceipt,
        context,
      );
    case Logger.errors.CALL_EXCEPTION:
      return new TransactionReverted(
        TransactionReverted.reasons.CallException,
        error.receipt as providers.TransactionReceipt,
        context,
      );
    case Logger.errors.NONCE_EXPIRED:
      return new BadNonce(BadNonce.reasons.NonceExpired, context);
    case Logger.errors.REPLACEMENT_UNDERPRICED:
      return new BadNonce(BadNonce.reasons.ReplacementUnderpriced, context);
    case Logger.errors.UNPREDICTABLE_GAS_LIMIT:
      return new UnpredictableGasLimit(context);
    case Logger.errors.TIMEOUT:
      return new OperationTimeout(context);
    case Logger.errors.NETWORK_ERROR:
      return new RpcError(RpcError.reasons.NetworkError, context);
    case Logger.errors.SERVER_ERROR:
      return new ServerError(ServerError.reasons.BadResponse, context);
    default:
      return error;
  }
};
