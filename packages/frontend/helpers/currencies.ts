import { Currency } from '@x-fuji/sdk';

export const isNativeOrWrapped = (
  currency: Currency,
  list: Currency[]
): boolean => {
  return (
    currency.isNative ||
    list.some((c) => c.isNative && c.wrapped.symbol === currency.symbol)
  );
};

export const nativeAndWrappedPair = (list: Currency[]): Currency[] => {
  const native = list.find((c) => c.isNative);
  if (!native) return [];
  return [native, native.wrapped];
};

export const wrappedSymbol = (currency: Currency): string => {
  return currency.isNative ? currency.wrapped.symbol : currency.symbol;
};

// Temp helper functions
export const isCurrencyBridgeable = ({ symbol }: Currency): boolean => {
  return symbol !== 'DAI' && symbol !== 'MaticX';
};

export const isCurrencyPairBridgeable = (
  collateral: Currency,
  debt: Currency
): boolean => {
  return isCurrencyBridgeable(collateral) && isCurrencyBridgeable(debt);
};
