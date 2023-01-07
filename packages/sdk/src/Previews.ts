import { BigNumber } from '@ethersproject/bignumber';
import invariant from 'tiny-invariant';

import { CONNEXT_DOMAIN, CONNEXT_ROUTER_ADDRESS } from './constants';
import { Address, BorrowingVault, Token } from './entities';
import { ChainId, RouterAction, RoutingStep } from './enums';
import {
  RouterActionParams,
  XTransferParams,
  XTransferWithCallParams,
} from './types/RouterActionParams';
import { RoutingStepDetails } from './types/RoutingStepDetails';

export class Previews {
  async deposit(
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token,
    account: Address,
    slippage?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;

    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    const activeProvider = (await vault.getProviders()).find((p) => p.active);
    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        amount: amountIn,
        chainId: srcChainId,
        token: vault.collateral,
      },
      {
        step: RoutingStep.DEPOSIT,
        amount: amountIn,
        chainId: srcChainId,
        token: vault.collateral,
        lendingProvider: activeProvider,
      },
    ];
    let actions: RouterActionParams[] = [];
    if (srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [vault.previewDeposit(amountIn, account, account)];
    } else {
      // transfer from chain A and deposit on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        vault.previewDeposit(amountIn, account, connextRouter),
      ];
      actions = [
        this.xTransferWithCall(
          vault.chainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
      steps.push({
        step: RoutingStep.X_TRANSFER,
        amount: amountIn,
        chainId: vault.chainId,
        token: vault.collateral,
      });
    }
    steps.push({
      step: RoutingStep.END,
      amount: amountIn,
      chainId: vault.chainId,
      token: vault.collateral,
    });

    return { actions, bridgeFee, steps, estimateTime };
  }

  /**
   * Prepares and returns 1) the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow; 2) the steps to be taken in order to
   * accomplish the operation; 3) the bridge fee; 4) the estimate time to process the tx
   * in seconds
   *
   * @remarks
   * The array that is returned should be first passed to `BorrowingVault.needSignature`.
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from `this.signPermitFor` and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from `this.getTxDetails` which is to be
   * used in ethers.sendTransaction.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token with which user starts the operation
   * @param tokenOut - token that user want to borrow
   * @param account - user address, wrapped in {@link Address}
   * @param deadline - timestamp for validity of permit (defaults to 24h starting from now)
   * @param slippage - accepted slippage in BPS as 30 == 0.3% (defaults to 0.3%)
   */
  async depositAndBorrow(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        vault.previewDeposit(amountIn, account, account),
        vault.previewPermitBorrow(amountOut, account, account, deadline),
        vault.previewBorrow(amountOut, account, account),
      ];
    } else if (srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      actions = [
        vault.previewDeposit(amountIn, account, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account, deadline),
        vault.previewBorrow(amountOut, connextRouter, account),
        this.xTransfer(destChainId, vault.debt, amountOut, account, _slippage),
      ];
    } else if (destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
      const innerActions = [
        vault.previewDeposit(amountIn, account, connextRouter),
        vault.previewPermitBorrow(amountOut, account, account, deadline),
        vault.previewBorrow(amountOut, account, account),
      ];
      actions = [
        this.xTransferWithCall(
          destChainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    const steps = await this._getRoutingStepsFor(
      vault,
      amountIn,
      amountOut,
      srcChainId,
      destChainId
    );

    return { actions, bridgeFee, steps, estimateTime };
  }

  xTransfer(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    receiver: Address,
    slippage: number
  ): XTransferParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
    invariant(destDomain, 'Chain is not available on Connext!');

    return {
      action: RouterAction.X_TRANSFER,
      destDomain,
      slippage,
      amount,
      asset: asset.address,
      receiver: receiver,
    };
  }

  xTransferWithCall(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    slippage: number,
    innerActions: RouterActionParams[]
  ): XTransferWithCallParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
    invariant(destDomain, `Chain ${destChainId} is not available on Connext!`);

    return {
      action: RouterAction.X_TRANSFER_WITH_CALL,
      destDomain,
      amount,
      asset: asset.address,
      slippage,
      innerActions,
    };
  }

  /**
   * Prepares and returns the steps that will be taken
   * in order to accomplish an operation.
   * IMPORTANT: only works for depositAndBorrow
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param srcChainId - chain ID from which the tx is initated
   * @param destChainId - chain ID where user wants their borrowed amount disbursed
   */
  private async _getRoutingStepsFor(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    destChainId: ChainId
  ): Promise<RoutingStepDetails[]> {
    const activeProvider = (await vault.getProviders()).find((p) => p.active);

    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        amount: amountIn,
        chainId: srcChainId,
        token: vault.collateral,
      },
    ];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      steps.push(
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: srcChainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: srcChainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        }
      );
    } else if (srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      steps.push(
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: srcChainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: srcChainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountOut,
          chainId: destChainId,
          token: vault.debt,
        }
      );
    } else if (destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      steps.push(
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountIn,
          chainId: srcChainId,
          token: vault.collateral,
        },
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: destChainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: destChainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        }
      );
    }
    steps.push({
      step: RoutingStep.END,
      amount: amountOut,
      chainId: destChainId,
      token: vault.debt,
    });

    return steps;
  }
}
