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

export const isNativeAndWrappedPair = (
  currency1: Currency,
  currency2: Currency
): boolean => {
  if (
    currency1.isNative &&
    !currency2.isNative &&
    currency1.wrapped.symbol === currency2.symbol
  ) {
    return true;
  }
  return (
    currency2.isNative &&
    !currency1.isNative &&
    currency2.wrapped.symbol === currency1.symbol
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
