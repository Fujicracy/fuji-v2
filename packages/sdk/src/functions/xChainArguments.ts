import { BigNumber } from 'ethers';

import { Currency } from '../entities';
import { BridgeFee, PreviewNxtpResult } from '../types';

export function defaultXChainArguments(): {
  estimateTime: number;
  estimateSlippage: BigNumber | undefined;
  bridgeFees: BridgeFee[] | undefined;
} {
  // TODO: estimate time
  return {
    estimateTime: 3 * 60,
    estimateSlippage: undefined,
    bridgeFees: undefined,
  };
}

export async function updateXChainArguments(
  currency: Currency,
  result: PreviewNxtpResult,
  secondCurrency?: Currency,
  secondResult?: PreviewNxtpResult
): Promise<{
  estimateSlippage: BigNumber;
  bridgeFees: BridgeFee[];
}> {
  const token = currency.wrapped;
  const secondToken = secondCurrency?.wrapped;

  const priceResult = await token.getPriceUSD();
  const priceUSD = priceResult.success ? priceResult.data : 0;
  const bridgeFees = [{ amount: result.bridgeFee, token, priceUSD }];

  let estimateSlippage = result.estimateSlippage;
  if (secondToken && secondResult) {
    const secondPriceResult = await secondToken.getPriceUSD();
    const secondPriceUSD = secondPriceResult.success
      ? secondPriceResult.data
      : 0;
    estimateSlippage = result.estimateSlippage.add(
      secondResult.estimateSlippage
    );
    bridgeFees.push({
      amount: secondResult.bridgeFee,
      token: secondToken,
      priceUSD: secondPriceUSD,
    });
  }

  return {
    estimateSlippage,
    bridgeFees,
  };
}
