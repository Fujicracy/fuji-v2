import {
  Address,
  ChainId,
  Currency,
  FujiResultPromise,
  FujiResultSuccess,
} from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { BALANCE_POLLING_INTERVAL } from '../constants';
import { sdk } from '../services/sdk';
import { onboard, useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';
import { AssetChange, AssetType } from './assets';

export const fetchBalances = async (
  currencies: Currency[],
  address: string,
  chainId: ChainId
): FujiResultPromise<Record<string, number>> => {
  const result = await sdk.getBalancesFor(
    currencies,
    Address.from(address),
    chainId
  );
  if (!result.success) {
    return result;
  }

  const rawBalances = result.data;

  const balances: Record<string, number> = {};
  rawBalances.forEach((b, i) => {
    const decimals = currencies[i].decimals;
    // TODO: TEMP FIX when user hits the max button:
    // Substract a small amount if decimals are 18
    // because parseFloat rounds up at the 15th digit.
    // https://stackoverflow.com/questions/7988827/parse-float-has-a-rounding-limit-how-can-i-fix-this
    const dust = (10 ** 5).toString();
    const toSub = decimals === 18 && b.gt(dust) ? dust : '0';
    const value = parseFloat(formatUnits(b.sub(toSub), currencies[i].decimals));
    balances[currencies[i].symbol] = value;
  });
  return new FujiResultSuccess(balances);
};

export const updateNativeBalance = (addr?: string) => {
  const address = addr ?? useAuth.getState().address;
  if (!address) return;
  onboard.state.actions.updateBalances([address]);
};

const checkBalances = async () => {
  const address = useAuth.getState().address;
  if (!address) return;

  // Triggers a native token refresh using onboard
  updateNativeBalance(address);

  if (!shouldFetchERC20 || isExecutingTx()) return;

  // Now let's to with ERC20 tokens
  const collateral = useBorrow.getState().collateral;
  const debt = useBorrow.getState().debt;

  await checkBalance(address, AssetType.Collateral, collateral);
  if (debt) await checkBalance(address, AssetType.Debt, debt);
};

const checkBalance = async (
  address: string,
  type: AssetType,
  asset: AssetChange
) => {
  const result = await fetchBalances(
    asset.selectableCurrencies,
    address,
    asset.currency.chainId
  );

  // Check if the call was successful and if we're now executing a tx
  if (!result.success || isExecutingTx()) {
    return;
  }

  const balances = result.data;

  // Grab again in case it changed while we were fetching
  const current =
    type === AssetType.Collateral
      ? useBorrow.getState().collateral
      : useBorrow.getState().debt;

  // Check if balances changed but don't even get there if chain changed
  if (
    current &&
    current.currency.chainId === asset.currency.chainId &&
    balancesDiffer(current.balances, balances)
  ) {
    useBorrow.getState().changeBalances(type, balances);
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

const poll = (pollFn: () => void) => {
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
