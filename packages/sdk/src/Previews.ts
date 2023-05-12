import { FujiResultError, FujiResultSuccess } from './entities';
import { OperationType, PreviewName } from './enums';
import { getPreviewActions, getPreviewRoutingDetails } from './functions';
import { FujiResult, FujiResultPromise, PreviewParams } from './types';
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
