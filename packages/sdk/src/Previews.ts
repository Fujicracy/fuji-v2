import { AddressZero } from '@ethersproject/constants';

import { Address, FujiResultError, FujiResultSuccess } from './entities';
import { OperationType, PreviewName, RoutingStep } from './enums';
import { getPreviewActions, getPreviewRoutingDetails } from './functions';
import {
  FujiResult,
  FujiResultPromise,
  PreviewParams,
  RoutingStepDetails,
} from './types';
import { PreviewResult } from './types/PreviewResult';

export class Previews {
  getOperationType(params: PreviewParams): FujiResult<OperationType> {
    const { name, vault, srcChainId } = params;
    if (name === PreviewName.DEPOSIT || name === PreviewName.PAYBACK) {
      if (params.tokenIn.chainId !== srcChainId) {
        return new FujiResultError('Unsupported DEPOSIT or PAYBACK operation!');
      }
      if (srcChainId === vault.chainId) {
        return new FujiResultSuccess(OperationType.ONE_CHAIN);
      } else {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_DEST);
      }
    } else if (name === PreviewName.BORROW || name === PreviewName.WITHDRAW) {
      if (
        srcChainId == vault.chainId &&
        params.tokenOut.chainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.ONE_CHAIN);
      } else if (
        srcChainId === vault.chainId &&
        params.tokenOut.chainId !== vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_SRC);
      } else if (
        srcChainId !== vault.chainId &&
        params.tokenOut.chainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_DEST);
      } else {
        return new FujiResultSuccess(OperationType.THREE_CHAIN);
      }
    } else {
      //PreviewName.DEPOSIT_AND_BORROW || PreviewName.PAYBACK_AND_WITHDRAW:
      const tokenOut = params.tokenOut;
      if (srcChainId === tokenOut.chainId && srcChainId == vault.chainId) {
        return new FujiResultSuccess(OperationType.ONE_CHAIN);
      } else if (
        srcChainId !== tokenOut.chainId &&
        srcChainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_SRC);
      } else if (
        srcChainId !== tokenOut.chainId &&
        tokenOut.chainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_DEST);
      } else {
        return new FujiResultSuccess(OperationType.THREE_CHAIN);
      }
    }
  }

  getOperationTypeFromSteps(
    steps: RoutingStepDetails[]
  ): FujiResult<OperationType> {
    const vaultChainId = steps.find((s) =>
      [
        RoutingStep.DEPOSIT,
        RoutingStep.BORROW,
        RoutingStep.PAYBACK,
        RoutingStep.WITHDRAW,
      ].includes(s.step)
    )?.chainId;
    const srcChainId = steps[0].chainId;
    const tokenIn = steps[0].token;
    const amountIn = steps[0].amount;
    const tokenOut = steps[steps.length - 1].token;
    const amountOut = steps[steps.length - 1].amount;

    const p = {
      srcChainId,
      tokenIn,
      amountIn,
      tokenOut,
      amountOut,
      // only vault.chainId is needed here
      vault: { chainId: vaultChainId },
      account: Address.from(AddressZero),
    };

    const isDeposit = steps.find((s) => s.step === RoutingStep.DEPOSIT);
    const isBorrow = steps.find((s) => s.step === RoutingStep.BORROW);
    const isPayback = steps.find((s) => s.step === RoutingStep.PAYBACK);
    const isWithdraw = steps.find((s) => s.step === RoutingStep.WITHDRAW);
    let name;
    if (isDeposit && isBorrow) {
      name = PreviewName.DEPOSIT_AND_BORROW;
    } else if (isPayback && isWithdraw) {
      name = PreviewName.PAYBACK_AND_WITHDRAW;
    } else if (isDeposit || isPayback) {
      name = isDeposit ? PreviewName.DEPOSIT : PreviewName.PAYBACK;
    } else {
      name = isBorrow ? PreviewName.BORROW : PreviewName.WITHDRAW;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getOperationType({ ...p, name } as any);
  }

  async get(params: PreviewParams): FujiResultPromise<PreviewResult> {
    const opResult = this.getOperationType(params);
    if (!opResult.success) return opResult;
    const operation = opResult.data;

    const actions = getPreviewActions(operation, params);
    const result = await getPreviewRoutingDetails(operation, params);
    if (!result.success) {
      return result;
    }
    return new FujiResultSuccess({
      actions,
      ...result.data,
    });
  }
}
