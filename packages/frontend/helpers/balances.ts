import { Address, ChainId, Token } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { sdk } from '../services/sdk';
import { onboard } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';

// TODO:
// - Call this each X seconds
// - Allow cancelation

export const fetchBalances = async (
  tokens: Token[],
  address: string,
  chainId: ChainId
) => {
  const rawBalances = await sdk.getTokenBalancesFor(
    tokens,
    Address.from(address),
    chainId
  );
  const balances: Record<string, number> = {};
  rawBalances.forEach((b, i) => {
    const value = parseFloat(formatUnits(b, tokens[i].decimals));
    balances[tokens[i].symbol] = value;
  });
  return balances;
};

const checkBalances = async (address: string | undefined) => {
  if (!address) {
    return;
  }

  const debt = useBorrow.getState().debt;
  const collateral = useBorrow.getState().collateral;

  const data = [collateral, debt];

  for (const d of data) {
    const balances = await fetchBalances(
      d.selectableTokens,
      address,
      d.token.chainId
    );
    console.log(balances);

    const stop =
      useBorrow.getState().isExecuting || useBorrow.getState().isSigning;
    if (stop) {
      return;
    }
    useBorrow.getState().debt.balances;
    // TODO:
    // - Check if stored balances are different
    // - If so, call changeBalances
  }

  // Triggers a native token refresh using onboard
  onboard.state.actions.updateBalances([address]);
};
