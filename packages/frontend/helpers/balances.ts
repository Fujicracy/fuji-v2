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

const balancesDiffer = (
  obj1: Record<string, number>,
  obj2: Record<string, number>
): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return true;
  }

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return true;
    }
  }

  return false;
};

const checkBalances = async (address: string | undefined) => {
  if (!address) {
    return;
  }
  // Triggers a native token refresh using onboard
  onboard.state.actions.updateBalances([address]);

  // Now let's to with ERC20 tokens
  const debt = useBorrow.getState().debt;
  const collateral = useBorrow.getState().collateral;

  const data = [collateral, debt];

  data.forEach(async (asset, i) => {
    const balances = await fetchBalances(
      asset.selectableTokens,
      address,
      asset.token.chainId
    );
    console.log(balances);

    const stop =
      useBorrow.getState().isExecuting || useBorrow.getState().isSigning;
    if (stop) {
      return;
    }
    const old = asset.balances;
    if (balancesDiffer(old, balances)) {
      const type = i === 0 ? 'collateral' : 'debt';
      useBorrow.getState().changeBalances(type, balances);
    }
  });
};

// TODO: polling
