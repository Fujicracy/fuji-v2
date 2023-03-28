import { Address, ChainId, Token } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { BALANCE_POLLING_INTERVAL } from '../constants';
import { sdk } from '../services/sdk';
import { onboard, useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';
import { AssetChange, AssetType } from './assets';

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

export const updateNativeBalance = (addr?: string) => {
  const address = addr ?? useAuth.getState().address;
  if (!address) return;
  onboard.state.actions.updateBalances([address]);
};

export const checkBalances = async () => {
  const address = useAuth.getState().address;
  if (!address) return;

  // Triggers a native token refresh using onboard
  updateNativeBalance(address);

  if (!shouldFetchERC20 || isExecutingTx()) return;

  // Now let's to with ERC20 tokens
  const collateral = useBorrow.getState().collateral;
  const debt = useBorrow.getState().debt;

  await checkBalance(address, 'collateral', collateral);
  await checkBalance(address, 'debt', debt);
};

const checkBalance = async (
  address: string,
  type: AssetType,
  asset: AssetChange
) => {
  const balances = await fetchBalances(
    asset.selectableTokens,
    address,
    asset.token.chainId
  );

  // Check again
  if (isExecutingTx()) {
    return;
  }

  // Grab again in case it changed while we were fetching
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
};

const isExecutingTx = () =>
  useBorrow.getState().isExecuting || useBorrow.getState().isSigning;

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

// Polling

export const pollBalances = () => {
  poll(checkBalances);
};

export const stopPolling = () => {
  cancelPoll();
};

let shouldFetchERC20 = false; // This ones are optional
let timerId: ReturnType<typeof setTimeout> | null = null;

export const changeERC20PollingPolicy = (value: boolean) => {
  shouldFetchERC20 = value;
};

export const poll = (pollFn: () => void) => {
  if (timerId !== null) {
    return; // Do nothing if there's already a timer in place
  }
  const callback = async () => {
    await pollFn();
    timerId = setTimeout(callback, BALANCE_POLLING_INTERVAL);
  };
  callback();
};

const cancelPoll = () => {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
};
