import { Currency, BRIDGEABLE_CURRENCY_SYMBOLS } from '@x-fuji/sdk';

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
export const isBridgeable = (currency: Currency): boolean => {
  return BRIDGEABLE_CURRENCY_SYMBOLS.includes(currency.symbol);
};
