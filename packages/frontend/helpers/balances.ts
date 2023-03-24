import { Address, ChainId, Token } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { sdk } from '../services/sdk';
import { onboard, useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';

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

export const checkBalances = async () => {
  const address = useAuth.getState().address;
  if (!address) {
    return;
  }
  // Triggers a native token refresh using onboard
  onboard.state.actions.updateBalances([address]);

  if (!shouldFetchERC20) {
    return;
  }
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

    // Grab again in case it changed while we were fetching
    const type = i === 0 ? 'collateral' : 'debt';
    const current =
      type === 'collateral'
        ? useBorrow.getState().collateral
        : useBorrow.getState().debt;

    // Check if balances changed but don't even get there if chain changed
    if (
      current.token.chainId === asset.token.chainId &&
      balancesDiffer(current.balances, balances)
    ) {
      useBorrow.getState().changeBalances(type, current.balances);
    }
  });
};

// Polling

export const pollBalances = () => {
  poll(checkBalances);
};

export const stopPolling = () => {
  cancelPoll();
};

const interval = 30000;
let timerId: ReturnType<typeof setTimeout> | null = null;
let shouldFetchERC20 = false;

export const changeERC20PollingPolicy = (value: boolean) => {
  shouldFetchERC20 = value;
};

export const poll = (callback: () => void) => {
  if (timerId !== null) {
    return; // Do nothing if there's already a timer
  }
  const pollFn = async () => {
    await callback();
    timerId = setTimeout(pollBalances, interval);
  };
  pollFn();
};

const cancelPoll = () => {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
};
