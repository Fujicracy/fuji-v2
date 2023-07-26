import { BigNumber } from 'ethers';
import { BigNumberish } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import moment from 'moment';

export const safeBnToNumber = (bn: BigNumber, decimals: number) => {
  // TODO: TEMP FIX when user hits the max button:
  // Subtract a small amount if decimals are 18
  // because parseFloat rounds up at the 15th digit.
  // https://stackoverflow.com/questions/7988827/parse-float-has-a-rounding-limit-how-can-i-fix-this
  const dust = (10 ** 5).toString();
  const toSub = decimals === 18 && bn.gt(dust) ? dust : '0';
  const value = parseFloat(formatUnits(bn.sub(toSub), decimals));
  return value;
};

export const validAmount = (
  amount: string | number,
  decimals: number
): string => {
  const value = typeof amount === 'number' ? amount.toString() : amount;

  let cleanedValue = '';
  let isAfterE = false;

  for (let i = 0; i < value.length; i++) {
    if (value[i] === '-') {
      if (isAfterE) {
        cleanedValue += '-';
      }
    } else if (value[i] === 'e') {
      cleanedValue += 'e';
      isAfterE = true;
    } else {
      cleanedValue += value[i];
      isAfterE = false;
    }
  }

  if (cleanedValue.indexOf('.') === -1) return cleanedValue;

  const parts = cleanedValue.split('.');
  const integerPart = parts[0].replace(/-/g, '');
  const decimalPart = parts[1];

  let formattedDecimalPart = '';
  if (decimalPart) {
    formattedDecimalPart = `.${decimalPart.substring(0, decimals)}`;
  }

  return `${integerPart}${formattedDecimalPart}`;
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
  params: Intl.NumberFormatOptions = { maximumFractionDigits: 4 }
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

export const formatAssetWithSymbol = ({
  amount = BigNumber.from('0'),
  symbol = '',
  decimals = 18,
  maximumFractionDigits = 4,
}: {
  amount?: BigNumberish | number;
  symbol?: string;
  decimals?: number;
  maximumFractionDigits?: number;
}) => {
  const value =
    typeof amount === 'number'
      ? amount
      : typeof amount === 'string'
      ? parseFloat(amount)
      : parseFloat(formatUnits(amount, decimals));

  return `${formatValue(value, { maximumFractionDigits })} ${symbol}`;
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
  moment(date).utc().format(format.toString());
