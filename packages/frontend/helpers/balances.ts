import {
  Address,
  ChainId,
  Currency,
  FujiResultPromise,
  FujiResultSuccess,
  NATIVE,
} from '@x-fuji/sdk';
import { BigNumber } from 'ethers';

import { BALANCE_POLLING_INTERVAL } from '../constants';
import { sdk } from '../services/sdk';
import { onboard, useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';
import { AssetChange, AssetType } from './assets';
import { chains } from './chains';
import { safeBnToNumber } from './values';

export type Balance = {
  currency: Currency;
  amount: number;
  amountUsd?: number;
};

export const fetchXBalances = async (): Promise<Balance[] | undefined> => {
  const address = useAuth.getState().address;
  const currentChainId = useAuth.getState().chainId;
  if (!address || !currentChainId) return;

  const values: Balance[] = [];
  const promises = chains.map(async (chain) => {
    const collaterals = sdk.getCollateralForChain(chain.chainId);
    const debts = sdk.getDebtForChain(chain.chainId);
    const currenciesMap = new Map();
    [...collaterals, ...debts].forEach((currency) => {
      currenciesMap.set(currency.address, currency);
    });

    // Add the native currency if it's not already in the map
    const nativeCurrency = NATIVE[chain.chainId];
    if (!currenciesMap.has(nativeCurrency.address)) {
      currenciesMap.set(nativeCurrency.address, nativeCurrency);
    }

    const currencies = Array.from(currenciesMap.values());
    const balances = await sdk.getBalancesFor(
      currencies,
      Address.from(address),
      chain.chainId
    );
    if (balances.success) {
      balances.data.forEach((bn: BigNumber, i: number) => {
        const currency = currencies[i];
        // console.log(currency.symbol, console.log(bn.toString()));
        const amount = safeBnToNumber(bn, currency.decimals);
        const balance: Balance = {
          currency,
          amount,
        };
        values.push(balance);
      });
    }
  });

  await Promise.all(promises);

  // Fetch USD prices for all currencies and multiply by the amount
  const pricePromises = values.map((balance) =>
    balance.currency
      .getPriceUSD()
      .then((result) =>
        result.success ? result.data * balance.amount : undefined
      )
  );
  const prices = await Promise.all(pricePromises);

  // Create a new array of balances with their corresponding USD prices
  const balancesWithPrices: Balance[] = values.map((balance, index) => ({
    ...balance,
    amountUsd: prices[index],
  }));

  // Sort the balances based on the USD prices and chainId
  balancesWithPrices.sort((a, b) => {
    // If both currencies are in the current chain
    if (
      a.currency.chainId === currentChainId &&
      b.currency.chainId === currentChainId
    ) {
      // If one of the currencies is native, put it first
      if (a.currency.isNative) {
        return -1;
      }
      if (b.currency.isNative) {
        return 1;
      }
      // If neither is native, sort by amountUsd
      if (a.amountUsd === undefined) {
        return 1;
      }
      if (b.amountUsd === undefined) {
        return -1;
      }
      return b.amountUsd - a.amountUsd;
    }

    // If only one of the currencies is in the current chain, put it first
    if (a.currency.chainId === currentChainId) {
      return -1;
    }
    if (b.currency.chainId === currentChainId) {
      return 1;
    }

    // If neither currency is in the current chain, sort by amountUsd
    if (a.amountUsd === undefined) {
      return 1;
    }
    if (b.amountUsd === undefined) {
      return -1;
    }
    return b.amountUsd - a.amountUsd;
  });

  balancesWithPrices.forEach(async (balance) => {
    console.log(
      balance.currency.symbol,
      balance.currency.isNative,
      balance.currency.chainId,
      balance.amount
    );
  });

  return balancesWithPrices;
};

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
    const value = safeBnToNumber(b, decimals);
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
