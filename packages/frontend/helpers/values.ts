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
  if (!v) return '0';
  const value: number = typeof v === 'number' ? v : Number(v);
  const leadingZeroes = -Math.floor(Math.log(value) / Math.log(10) + 1); // Account leading zeroes
  const to = leadingZeroes > 0 ? 1 + leadingZeroes : 2;
  return Number(value.toFixed(to)).toString(); // Remove trailing zeroes
};

export const camelize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const hiddenAddress = (address: string | undefined) =>
  address?.substring(0, 5) + '...' + address?.substring(address?.length - 4);
