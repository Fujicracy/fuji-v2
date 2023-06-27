import { BigNumber } from '@ethersproject/bignumber';

import { BN_ZERO } from '../constants';
import { CHAIN } from '../constants/chains';
import { LENDING_PROVIDERS } from '../constants/lending-providers';
import {
  BorrowingVault,
  Chain,
  Currency,
  FujiResultError,
  FujiResultSuccess,
} from '../entities';
import { LendingVault } from '../entities/LendingVault';
import { ChainId, OperationType, PreviewName, RoutingStep } from '../enums';
import { Nxtp } from '../Nxtp';
import { PreviewNxtpResult } from '../types';
import { FujiResultPromise } from '../types/FujiResult';
import { MetaRoutingResult } from '../types/MetaRoutingResult';
import {
  BorrowPreviewParams,
  DepositAndBorrowPreviewParams,
  DepositPreviewParams,
  PaybackAndWithdrawPreviewParams,
  PaybackPreviewParams,
  PreviewParams,
  WithdrawPreviewParams,
} from '../types/PreviewParams';
import { RoutingStepDetails } from '../types/RoutingStepDetails';
import {
  defaultXChainArguments,
  updateXChainArguments,
} from './xChainArguments';

function _step(
  step: RoutingStep,
  chainId: ChainId,
  amount?: BigNumber,
  currency?: Currency,
  lendingProvider?: string
): RoutingStepDetails {
  return {
    step,
    amount,
    chainId,
    token: currency?.wrapped,
    lendingProvider: lendingProvider
      ? LENDING_PROVIDERS[chainId][lendingProvider]
      : undefined,
  };
}

async function _callNxtp(
  srcChain: Chain,
  destChain: Chain,
  currency: Currency,
  amount: BigNumber
): FujiResultPromise<PreviewNxtpResult> {
  const token = currency.wrapped;
  if (amount.eq(0)) {
    return new FujiResultSuccess({
      received: BN_ZERO,
      estimateSlippage: BN_ZERO,
      bridgeFee: BN_ZERO,
    });
  }
  try {
    const nxtp = await Nxtp.getOrCreate(token.chain.chainType);

    const [assets, routing] = await Promise.all([
      nxtp.utils.getAssetsData(),
      nxtp.pool.calculateAmountReceived(
        srcChain.getConnextDomain(),
        destChain.getConnextDomain(),
        token.address.value,
        amount
      ),
    ]);

    const isSupported = assets.find(
      (a: { adopted: string }) =>
        a.adopted === token.address.value.toLowerCase()
    );
    if (!isSupported) {
      return new FujiResultError('Asset is not supported by Connext!');
    }

    const { amountReceived, originSlippage, destinationSlippage, routerFee } =
      routing;

    return new FujiResultSuccess({
      received: amountReceived as BigNumber,
      estimateSlippage: (originSlippage as BigNumber).add(destinationSlippage),
      bridgeFee: routerFee as BigNumber,
    });
  } catch (e) {
    return new FujiResultSuccess({
      received: amount,
      estimateSlippage: BN_ZERO,
      bridgeFee: BN_ZERO,
    });
  }
}

// DEPOSIT or PAYBACK
async function depositOrPayback(
  step: RoutingStep.DEPOSIT | RoutingStep.PAYBACK,
  op: OperationType,
  params: DepositPreviewParams | PaybackPreviewParams
): FujiResultPromise<MetaRoutingResult> {
  const { vault, amountIn, tokenIn } = params;

  const activeProvider = vault.activeProvider;

  const { estimateTime, ...rest } = defaultXChainArguments();
  let { estimateSlippage, bridgeFees } = rest;

  const vaultToken =
    step === RoutingStep.PAYBACK && vault instanceof BorrowingVault
      ? vault.debt
      : vault.collateral;

  const steps: RoutingStepDetails[] = [
    _step(RoutingStep.START, tokenIn.chainId, amountIn, tokenIn),
  ];

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    steps.push(
      _step(step, tokenIn.chainId, amountIn, vaultToken, activeProvider),
      _step(RoutingStep.END, vault.chainId, amountIn, vaultToken)
    );
  } else {
    // transfer from chain A and deposit/payback on chain B
    const result = await _callNxtp(
      tokenIn.chain,
      vault.chain,
      tokenIn,
      amountIn
    );
    if (!result.success) {
      return result;
    }
    const r = result.data;

    const updatedArguments = await updateXChainArguments(vaultToken, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    steps.push(
      _step(RoutingStep.X_TRANSFER, tokenIn.chainId, amountIn, vaultToken),
      _step(step, vault.chainId, r.received, vaultToken, activeProvider),
      _step(RoutingStep.END, vault.chainId, r.received, vaultToken)
    );
  }

  return new FujiResultSuccess({
    steps,
    estimateSlippage,
    estimateTime,
    bridgeFees,
  });
}

// BORROW or WITHDRAW
async function borrowOrWithdraw(
  step: RoutingStep.BORROW | RoutingStep.WITHDRAW,
  op: OperationType,
  params: BorrowPreviewParams | WithdrawPreviewParams
): FujiResultPromise<MetaRoutingResult> {
  const { vault, srcChainId, amountOut, tokenOut } = params;

  const activeProvider = vault.activeProvider;

  const { estimateTime, ...rest } = defaultXChainArguments();
  let { estimateSlippage, bridgeFees } = rest;

  const vaultToken =
    step === RoutingStep.BORROW && vault instanceof BorrowingVault
      ? vault.debt
      : vault.collateral;

  const steps: RoutingStepDetails[] = [_step(RoutingStep.START, srcChainId)];

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    steps.push(
      _step(step, vault.chainId, amountOut, tokenOut, activeProvider),
      _step(RoutingStep.END, vault.chainId, amountOut, tokenOut)
    );
  } else if (op == OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // start from chain A, borrow/withdraw on chain A and transfer to chain B
    const result = await _callNxtp(
      CHAIN[srcChainId],
      vault.chain,
      vaultToken,
      amountOut
    );
    if (!result.success) {
      return result;
    }
    const r = result.data;
    const updatedArguments = await updateXChainArguments(vaultToken, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    // Transfer will pass through the fast path
    // so we need to account for the router fee (0.05) + slippage
    steps.push(
      _step(step, srcChainId, amountOut, vaultToken, activeProvider),
      _step(RoutingStep.X_TRANSFER, vault.chainId, amountOut, tokenOut),
      _step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
    );
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // start from chain A and borrow/withdraw on chain B where's also the position
    // => no transfer of funds
    steps.push(
      _step(RoutingStep.X_TRANSFER, srcChainId, BN_ZERO, vaultToken),
      _step(step, vault.chainId, amountOut, vaultToken, activeProvider),
      _step(RoutingStep.END, vault.chainId, amountOut, tokenOut)
    );
  } else {
    const result = await _callNxtp(
      vault.chain,
      tokenOut.chain,
      vaultToken,
      amountOut
    );
    if (!result.success) {
      return result;
    }
    const r = result.data;
    const updatedArguments = await updateXChainArguments(vaultToken, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    steps.push(
      _step(RoutingStep.X_TRANSFER, srcChainId, BN_ZERO, vaultToken),
      _step(step, vault.chainId, amountOut, vaultToken, activeProvider),
      _step(RoutingStep.X_TRANSFER, vault.chainId, amountOut, tokenOut),
      _step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
    );
  }

  return new FujiResultSuccess({
    steps,
    estimateSlippage,
    estimateTime,
    bridgeFees,
  });
}

/**
 * Prepares and returns the steps that will be taken
 * in order to accomplish a deposit+borrow operation.
 *
 * @param vault - vault instance on which we want to open a position
 * @param amountIn - amount of provided collateral
 * @param amountOut - amount of loan
 * @param tokenIn - token provided by the user
 * @param tokenOut - token seeked by the user
 */
async function depositAndBorrow(
  op: OperationType,
  params: DepositAndBorrowPreviewParams
): FujiResultPromise<MetaRoutingResult> {
  const { vault, amountIn, tokenIn, amountOut, tokenOut } = params;
  if (vault instanceof LendingVault) {
    return new FujiResultError('Wrong vault type');
  }
  const debt = (vault as BorrowingVault).debt;
  const activeProvider = vault.activeProvider;

  const { estimateTime, ...rest } = defaultXChainArguments();
  let { estimateSlippage, bridgeFees } = rest;

  const steps: RoutingStepDetails[] = [
    _step(RoutingStep.START, tokenIn.chainId, amountIn, tokenIn),
  ];
  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    steps.push(
      _step(
        RoutingStep.DEPOSIT,
        tokenIn.chainId,
        amountIn,
        vault.collateral,
        activeProvider
      ),
      _step(
        RoutingStep.BORROW,
        tokenOut.chainId,
        amountOut,
        debt,
        activeProvider
      ),
      _step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
    );
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // deposit and borrow on chain A and transfer to chain B
    const result = await _callNxtp(
      tokenIn.chain,
      tokenOut.chain,
      debt,
      amountOut
    );
    if (!result.success) {
      return result;
    }
    const r = result.data;
    const updatedArguments = await updateXChainArguments(debt, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    // Transfer will pass through the fast path
    // so we need to account for the router fee (0.05) + slippage
    steps.push(
      _step(
        RoutingStep.DEPOSIT,
        vault.chainId,
        amountIn,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.BORROW, vault.chainId, amountOut, debt, activeProvider),
      _step(RoutingStep.X_TRANSFER, vault.chainId, amountOut, tokenOut),
      _step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
    );
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and deposit and borrow on chain B
    const result = await _callNxtp(
      tokenIn.chain,
      tokenOut.chain,
      tokenIn,
      amountIn
    );
    if (!result.success) return result;

    const r = result.data;
    const updatedArguments = await updateXChainArguments(tokenIn, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    steps.push(
      _step(
        RoutingStep.X_TRANSFER,
        tokenIn.chainId,
        amountIn,
        vault.collateral
      ),
      _step(
        RoutingStep.DEPOSIT,
        vault.chainId,
        r.received,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.BORROW, vault.chainId, amountOut, debt, activeProvider),
      _step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
    );
  } else {
    const [result1, result2] = await Promise.all([
      _callNxtp(tokenIn.chain, vault.chain, tokenIn, amountIn),
      _callNxtp(vault.chain, tokenOut.chain, debt, amountOut),
    ]);
    if (!result1.success) return result1;
    if (!result2.success) return result2;

    const r1 = result1.data;
    const r2 = result2.data;
    const updatedArguments = await updateXChainArguments(tokenIn, r1, debt, r2);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    steps.push(
      _step(
        RoutingStep.X_TRANSFER,
        tokenIn.chainId,
        amountIn,
        vault.collateral
      ),
      _step(
        RoutingStep.DEPOSIT,
        vault.chainId,
        r1.received,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.BORROW, vault.chainId, amountOut, debt, activeProvider),
      _step(RoutingStep.X_TRANSFER, vault.chainId, amountOut, tokenOut),
      _step(RoutingStep.END, tokenOut.chainId, r2.received, tokenOut)
    );
  }

  return new FujiResultSuccess({
    steps,
    estimateSlippage,
    estimateTime,
    bridgeFees,
  });
}

/**
 * Prepares and returns the steps that will be taken
 * in order to accomplish a payback+withdraw operation.
 *
 * @param vault - vault instance on which we want to open a position
 * @param amountIn - amount of provided collateral
 * @param amountOut - amount of loan
 * @param tokenIn - token provided by the user
 * @param tokenOut - token seeked by the user
 */
async function paybackAndWithdraw(
  op: OperationType,
  params: PaybackAndWithdrawPreviewParams
): FujiResultPromise<MetaRoutingResult> {
  const { vault, amountIn, tokenIn, amountOut, tokenOut } = params;
  if (vault instanceof LendingVault) {
    return new FujiResultError('Wrong vault type');
  }
  const debt = (vault as BorrowingVault).debt;
  const activeProvider = vault.activeProvider;

  const { estimateTime, ...rest } = defaultXChainArguments();
  let { estimateSlippage, bridgeFees } = rest;

  const steps: RoutingStepDetails[] = [
    _step(RoutingStep.START, tokenIn.chainId, amountIn, tokenIn),
  ];
  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    steps.push(
      _step(
        RoutingStep.PAYBACK,
        tokenIn.chainId,
        amountIn,
        debt,
        activeProvider
      ),
      _step(
        RoutingStep.WITHDRAW,
        tokenOut.chainId,
        amountOut,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
    );
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // payback and withdraw on chain A and transfer to chain B
    const result = await _callNxtp(
      tokenIn.chain,
      tokenOut.chain,
      vault.collateral,
      amountOut
    );
    if (!result.success) {
      return result;
    }
    const r = result.data;
    const updatedArguments = await updateXChainArguments(vault.collateral, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    // Transfer will pass through the fast path
    // so we need to account for the router fee (0.05) + slippage
    steps.push(
      _step(RoutingStep.PAYBACK, vault.chainId, amountIn, debt, activeProvider),
      _step(
        RoutingStep.WITHDRAW,
        vault.chainId,
        amountOut,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.X_TRANSFER, vault.chainId, amountOut, tokenOut),
      _step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
    );
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and payback and withdraw on chain B
    const result = await _callNxtp(
      tokenIn.chain,
      tokenOut.chain,
      tokenIn,
      amountIn
    );
    if (!result.success) {
      return result;
    }
    const r = result.data;
    const updatedArguments = await updateXChainArguments(tokenIn, r);
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    steps.push(
      _step(RoutingStep.X_TRANSFER, tokenIn.chainId, amountIn, debt),
      _step(
        RoutingStep.PAYBACK,
        vault.chainId,
        r.received,
        debt,
        activeProvider
      ),
      _step(
        RoutingStep.WITHDRAW,
        vault.chainId,
        amountOut,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
    );
  } else {
    const [result1, result2] = await Promise.all([
      _callNxtp(tokenIn.chain, vault.chain, tokenIn, amountIn),
      _callNxtp(vault.chain, tokenOut.chain, vault.collateral, amountOut),
    ]);
    if (!result1.success) return result1;
    if (!result2.success) return result2;

    const r1 = result1.data;
    const r2 = result2.data;
    const updatedArguments = await updateXChainArguments(
      tokenIn,
      r1,
      vault.collateral,
      r2
    );
    estimateSlippage = updatedArguments.estimateSlippage;
    bridgeFees = updatedArguments.bridgeFees;

    steps.push(
      _step(RoutingStep.X_TRANSFER, tokenIn.chainId, amountIn, debt),
      _step(
        RoutingStep.PAYBACK,
        vault.chainId,
        r1.received,
        debt,
        activeProvider
      ),
      _step(
        RoutingStep.WITHDRAW,
        vault.chainId,
        amountOut,
        vault.collateral,
        activeProvider
      ),
      _step(RoutingStep.X_TRANSFER, vault.chainId, amountOut, tokenOut),
      _step(RoutingStep.END, tokenOut.chainId, r2.received, tokenOut)
    );
  }

  return new FujiResultSuccess({
    steps,
    estimateSlippage,
    estimateTime,
    bridgeFees,
  });
}

export function getPreviewRoutingDetails(
  op: OperationType,
  params: PreviewParams
): FujiResultPromise<MetaRoutingResult> {
  const { name } = params;

  if (name === PreviewName.DEPOSIT) {
    return depositOrPayback(RoutingStep.DEPOSIT, op, params);
  } else if (name === PreviewName.BORROW) {
    return borrowOrWithdraw(RoutingStep.BORROW, op, params);
  } else if (name === PreviewName.PAYBACK) {
    return depositOrPayback(RoutingStep.PAYBACK, op, params);
  } else if (name === PreviewName.WITHDRAW) {
    return borrowOrWithdraw(RoutingStep.WITHDRAW, op, params);
  } else if (name === PreviewName.DEPOSIT_AND_BORROW) {
    return depositAndBorrow(op, params);
  } else {
    return paybackAndWithdraw(op, params);
  }
}
