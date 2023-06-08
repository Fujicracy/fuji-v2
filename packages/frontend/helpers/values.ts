import { BigNumber } from 'ethers';
import { BigNumberish } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import moment from 'moment';

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
  decimals: number | BigNumberish,
  big?: BigNumberish
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
  balance?: number | string,
  rounding?: boolean
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

export const toNotSoFixed = (
  v: number | string | undefined,
  stopAtFirstNonZero = false
): string => {
  if (!v) return '0.00';
  const value: number = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(value)) return '0.00';

  const stringValue = value.toString();
  const decimalIndex = stringValue.indexOf('.');
  if (decimalIndex === -1) return stringValue;

  let digitsAfterDecimal = stringValue.length - decimalIndex - 1;
  let lastNonZeroIndex = stringValue.length - 1;
  for (let i = stringValue.length - 1; i > decimalIndex; i--) {
    if (stringValue[i] !== '0') {
      lastNonZeroIndex = i;
      break;
    }
    digitsAfterDecimal--;
  }

  if (stopAtFirstNonZero) {
    for (let i = decimalIndex + 1; i < lastNonZeroIndex; i++) {
      if (stringValue[i] !== '0') {
        digitsAfterDecimal = i - decimalIndex;
        break;
      }
    }
  }

  return value
    .toFixed(digitsAfterDecimal < 2 ? 2 : digitsAfterDecimal)
    .replace(/\.?0+$/, '');
};

export const camelize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const hiddenAddress = (address: string | undefined) =>
  address?.substring(0, 5) + '...' + address?.substring(address?.length - 4);

export enum DateFormat {
  YEAR = 'MMM D, YYYY',
  MONTH = 'MMM D',
}

export const formattedDate = (format: DateFormat, date?: string) =>
  moment(date).format(format.toString());
