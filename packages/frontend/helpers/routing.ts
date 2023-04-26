import {
  Address,
  BorrowingVault,
  FujiResult,
  FujiResultPromise,
  FujiResultSuccess,
  PreviewName,
  PreviewResult,
  RouterActionParams,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { sdk } from '../services/sdk';
import { Mode } from './assets';
import { validBigNumberAmount } from './values';

export type RouteMeta = {
  //gasFees: number
  address: string;
  recommended: boolean;
  steps: RoutingStepDetails[];
  actions: RouterActionParams[];
  estimateTime: number;
  estimateSlippage: number | undefined;
  bridgeFees: number[] | undefined;
};

export const fetchRoutes = async (
  mode: Mode,
  vault: BorrowingVault,
  collateralToken: Token,
  debtToken: Token,
  collateralInput: string,
  debtInput: string,
  address: string,
  recommended: boolean,
  slippage: number
): FujiResultPromise<RouteMeta> => {
  let result: FujiResult<PreviewResult>;
  switch (mode) {
    case Mode.DEPOSIT_AND_BORROW:
      result = await sdk.previews.get({
        name: PreviewName.DEPOSIT_AND_BORROW,
        srcChainId: collateralToken.chainId,
        vault,
        amountIn: validBigNumberAmount(
          collateralInput,
          collateralToken.decimals
        ),
        amountOut: validBigNumberAmount(debtInput, debtToken.decimals),
        tokenIn: collateralToken,
        tokenOut: debtToken,
        account: Address.from(address),
        slippage,
      });
      break;
    case Mode.DEPOSIT:
      result = await sdk.previews.get({
        name: PreviewName.DEPOSIT,
        srcChainId: collateralToken.chainId,
        vault,
        amountIn: validBigNumberAmount(
          collateralInput,
          collateralToken.decimals
        ),
        tokenIn: collateralToken,
        account: Address.from(address),
        slippage,
      });
      break;
    case Mode.BORROW:
      result = await sdk.previews.get({
        name: PreviewName.BORROW,
        vault,
        srcChainId: collateralToken.chainId,
        amountOut: validBigNumberAmount(debtInput, debtToken.decimals),
        tokenOut: debtToken,
        account: Address.from(address),
        slippage,
      });
      break;
    case Mode.PAYBACK_AND_WITHDRAW:
      result = await sdk.previews.get({
        name: PreviewName.PAYBACK_AND_WITHDRAW,
        vault,
        srcChainId: debtToken.chainId,
        amountIn: validBigNumberAmount(debtInput, debtToken.decimals),
        amountOut: validBigNumberAmount(
          collateralInput,
          collateralToken.decimals
        ),
        tokenIn: debtToken,
        tokenOut: collateralToken,
        account: Address.from(address),
        slippage,
      });
      break;
    case Mode.WITHDRAW:
      result = await sdk.previews.get({
        name: PreviewName.WITHDRAW,
        vault,
        srcChainId: vault.collateral.chainId,
        amountOut: validBigNumberAmount(
          collateralInput,
          collateralToken.decimals
        ),
        tokenOut: collateralToken,
        account: Address.from(address),
        slippage,
      });
      break;
    case Mode.PAYBACK:
      result = await sdk.previews.get({
        name: PreviewName.PAYBACK,
        srcChainId: debtToken.chainId,
        vault,
        amountIn: validBigNumberAmount(debtInput, debtToken.decimals),
        tokenIn: debtToken,
        account: Address.from(address),
        slippage,
      });
      break;
  }
  if (!result.success) return result;

  const preview: PreviewResult = result.data;
  const { bridgeFees, estimateSlippage, estimateTime, actions, steps } =
    preview;

  const bridgeStep = steps.find((s) => s.step === RoutingStep.X_TRANSFER);
  const _bridgeFees = bridgeFees && [
    Number(
      bridgeStep
        ? formatUnits(bridgeFees[0], bridgeStep.token?.decimals ?? 18)
        : '0'
    ),
  ];

  return new FujiResultSuccess({
    address: vault.address.value,
    recommended,
    bridgeFees: _bridgeFees,
    // slippage is in basis points
    estimateSlippage: estimateSlippage && estimateSlippage.toNumber() / 100,
    estimateTime,
    actions,
    steps,
  });
};

export function isCrossChainTransaction(steps: RoutingStepDetails[]): boolean {
  const start = steps.find((item) => item.step === RoutingStep.START);
  const end = steps.find((item) => item.step === RoutingStep.END);

  return start?.chainId !== end?.chainId;
}
