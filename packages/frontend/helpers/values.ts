import { BigNumber } from 'ethers';
import { BigNumberish } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

export const validAmount = (
  amount: string | number,
  decimals: number
): string => {
  const value = typeof amount === 'number' ? amount.toString() : amount;
  if (value.indexOf('.') === -1) return value;

  const arr = value.split('.');
  const fraction = arr[1].substring(0, decimals);
  return arr[0] + '.' + fraction;
};

export const validBigNumberAmount = (
  amount: string,
  decimals: number
): BigNumber => {
  const valid = validAmount(amount, decimals);
  return parseUnits(valid, decimals);
};

export const bigToFloat = (
  big: BigNumberish | undefined,
  decimals: number | BigNumberish
): number => {
  const value = big ?? parseUnits('0', 18);
  return parseFloat(formatUnits(value, decimals));
};

export const formatValue = (
  value: string | number | undefined,
  params: Intl.NumberFormatOptions = {}
): string => {
  if (params.style === 'currency') {
    params.currency = 'USD';
  }
  return value?.toLocaleString('en-US', params) || '';
};

/*
  Format the balance depending of the token.
  If no token is specified, 5 digits are used.
  Else, eth based tokens use 4 digits
*/
export const formatBalance = (
  balance: number | string | undefined,
  rounding: boolean | undefined = undefined
): string => {
  return (
    formatValue(balance, { notation: rounding ? 'compact' : 'standard' }) ?? '0'
  );
};

export const formatNumber = (
  num: number | undefined,
  decimals: number
): number | '-' => {
  if (!num) return '-';
  return parseFloat(num.toFixed(decimals));
};

export const toNotSoFixed = (v: number | string | undefined): string => {
  if (!v) return '0.0';
  const value: number = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(value)) return '0.0';
  const to =
    value === 0 ? 1 : Math.max(1, 2 - Math.floor(Math.log10(Math.abs(value))));
  return value.toFixed(to).replace(/\.?0+$/, '');
};

export const camelize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const hiddenAddress = (address: string | undefined) =>
  address?.substring(0, 5) + '...' + address?.substring(address?.length - 4);
