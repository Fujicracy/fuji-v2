import {
  Address,
  BorrowingVault,
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
): Promise<{
  data?: RouteMeta;
  error?: Error;
}> => {
  const result: {
    data?: RouteMeta;
    error?: Error;
  } = {};
  try {
    let preview: PreviewResult;
    switch (mode) {
      case Mode.DEPOSIT_AND_BORROW:
        preview = await sdk.previews.depositAndBorrow(
          vault,
          validBigNumberAmount(collateralInput, collateralToken.decimals),
          validBigNumberAmount(debtInput, debtToken.decimals),
          collateralToken,
          debtToken,
          Address.from(address),
          undefined,
          slippage
        );
        break;
      case Mode.DEPOSIT:
        preview = await sdk.previews.deposit(
          vault,
          validBigNumberAmount(collateralInput, collateralToken.decimals),
          collateralToken,
          Address.from(address),
          slippage
        );
        break;
      case Mode.BORROW:
        preview = await sdk.previews.borrow(
          vault,
          collateralToken.chainId,
          validBigNumberAmount(debtInput, debtToken.decimals),
          debtToken,
          Address.from(address),
          undefined,
          slippage
        );
        break;
      case Mode.PAYBACK_AND_WITHDRAW:
        preview = await sdk.previews.paybackAndWithdraw(
          vault,
          validBigNumberAmount(debtInput, debtToken.decimals),
          validBigNumberAmount(collateralInput, collateralToken.decimals),
          debtToken,
          collateralToken,
          Address.from(address),
          undefined,
          slippage
        );
        break;
      case Mode.WITHDRAW:
        preview = await sdk.previews.withdraw(
          vault,
          vault.collateral.chainId,
          validBigNumberAmount(collateralInput, collateralToken.decimals),
          collateralToken,
          Address.from(address),
          undefined,
          slippage
        );
        break;
      case Mode.PAYBACK:
        preview = await sdk.previews.payback(
          vault,
          validBigNumberAmount(debtInput, debtToken.decimals),
          debtToken,
          Address.from(address),
          slippage
        );
        break;
    }
    const { bridgeFee, estimateSlippage, estimateTime, actions, steps } =
      preview;

    const bridgeStep = steps.find((s) => s.step === RoutingStep.X_TRANSFER);
    const _bridgeFee = bridgeStep
      ? formatUnits(bridgeFee, bridgeStep.token?.decimals ?? 18)
      : '0';

    result.data = {
      address: vault.address.value,
      recommended,
      bridgeFee: Number(_bridgeFee),
      // slippage is in basis points
      estimateSlippage: estimateSlippage.toNumber() / 100,
      estimateTime,
      actions,
      steps,
    };
    return result;
  } catch (e) {
    if (e instanceof Error) result.error = e;
  }
  return result;
};
