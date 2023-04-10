export const CONFIRMATIONS = 3;

export const BALANCE_POLLING_INTERVAL = 15000;

export enum PATH {
  MARKETS = '/',
  BORROW = '/borrow',
  LEND = '/lend',
  MY_POSITIONS = '/my-positions',
  POSITION = '/my-positions/[pid]',
  THEMING = '/theming',
}
