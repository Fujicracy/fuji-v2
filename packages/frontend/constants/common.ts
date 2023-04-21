export const CONNEXT_WARNING_DURATION = 1000 * 60 * 10; // 10 minutes
export const BALANCE_POLLING_INTERVAL = 15000;
export const TRANSACTION_META_DEBOUNCE_INTERVAL = 750;

export enum PATH {
  MARKETS = '/',
  BORROW = '/borrow',
  LEND = '/lend',
  MY_POSITIONS = '/my-positions',
  POSITION = '/my-positions/[pid]',
  THEMING = '/theming',
}

export enum SOCIAL_URL {
  DISCORD = 'https://discord.com/invite/dnvJeEMeDJ',
  TWITTER = 'https://twitter.com/FujiFinance',
}
