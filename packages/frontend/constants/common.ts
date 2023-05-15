import { ChainId } from '@x-fuji/sdk';

export const DEFAULT_CHAIN_ID = ChainId.MATIC;

export const CONNEXT_WARNING_DURATION = 1000 * 60 * 10; // 10 minutes
export const BALANCE_POLLING_INTERVAL = 15000;
export const TX_WATCHING_POLLING_INTERVAL = 3000;
export const TRANSACTION_META_DEBOUNCE_INTERVAL = 750;

export enum FUJI_INFO {
  NAME = 'Fuji V2 Himalaya',
  SUPPORT_EMAIL = 'support@fuji.finance',
  APP_URL = 'https://app.fuji.finance',
  DESCRIPTION = 'Deposit, borrow and repay from any chain',
}

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

export const SENTRY_DSN =
  'https://f64501e2fca94d6c9434a00ed0aece54@o1151449.ingest.sentry.io/4504884437057536';
