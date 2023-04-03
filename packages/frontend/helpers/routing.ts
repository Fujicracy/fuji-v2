import {
  Address,
  BorrowingVault,
  FujiResult,
  FujiResultPromise,
  FujiResultSuccess,
  PreviewResult,
  RouterActionParams,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from '@x-fuji/sdk';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

import { sdk } from '../services/sdk';
import { Mode } from './assets';

export type RouteMeta = {
  //gasFees: number
  estimateSlippage: number;
  bridgeFee: number;
  estimateTime: number;
  steps: RoutingStepDetails[];
  actions: RouterActionParams[];
  address: string;
  recommended: boolean;
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
  slippage?: number
): FujiResultPromise<RouteMeta> => {
  let result: FujiResult<PreviewResult>;
  switch (mode) {
    case Mode.DEPOSIT_AND_BORROW:
      result = await sdk.previews.depositAndBorrow(
        vault,
        parseUnits(collateralInput, collateralToken.decimals),
        parseUnits(debtInput, debtToken.decimals),
        collateralToken,
        debtToken,
        Address.from(address),
        undefined,
        slippage
      );
      break;
    case Mode.DEPOSIT:
      result = await sdk.previews.deposit(
        vault,
        parseUnits(collateralInput, collateralToken.decimals),
        collateralToken,
        Address.from(address),
        slippage
      );
      break;
    case Mode.BORROW:
      result = await sdk.previews.borrow(
        vault,
        collateralToken.chainId,
        parseUnits(debtInput, debtToken.decimals),
        debtToken,
        Address.from(address),
        undefined,
        slippage
      );
      break;
    case Mode.PAYBACK_AND_WITHDRAW:
      result = await sdk.previews.paybackAndWithdraw(
        vault,
        parseUnits(debtInput, debtToken.decimals),
        parseUnits(collateralInput, collateralToken.decimals),
        debtToken,
        collateralToken,
        Address.from(address),
        undefined,
        slippage
      );
      break;
    case Mode.WITHDRAW:
      result = await sdk.previews.withdraw(
        vault,
        vault.collateral.chainId,
        parseUnits(collateralInput, collateralToken.decimals),
        collateralToken,
        Address.from(address),
        undefined,
        slippage
      );
      break;
    case Mode.PAYBACK:
      result = await sdk.previews.payback(
        vault,
        parseUnits(debtInput, debtToken.decimals),
        debtToken,
        Address.from(address),
        slippage
      );
      break;
  }
  if (!result.success) return result;

  const preview: PreviewResult = result.data;
  const { bridgeFee, estimateSlippage, estimateTime, actions, steps } = preview;

  const bridgeStep = steps.find((s) => s.step === RoutingStep.X_TRANSFER);
  const _bridgeFee = bridgeStep
    ? formatUnits(bridgeFee, bridgeStep.token?.decimals ?? 18)
    : '0';

  return new FujiResultSuccess({
    address: vault.address.value,
    recommended,
    bridgeFee: Number(_bridgeFee),
    // slippage is in basis points
    estimateSlippage: estimateSlippage.toNumber() / 100,
    estimateTime,
    actions,
    steps,
  });
};
