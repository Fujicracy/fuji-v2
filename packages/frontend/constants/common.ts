import { fujiLogo } from './ui';

export const CONNEXT_WARNING_DURATION = 1000 * 60 * 10; // 10 minutes

export const BALANCE_POLLING_INTERVAL = 15000;

export enum FUJI_INFO {
  NAME = 'Fuji V2 Himalaya',
  SUPPORT_EMAIL = 'support@fuji.finance',
  APP_URL = 'https://app.fuji.finance',
  DESCRIPTION = 'Deposit, borrow and repay from any chain',
  LOGO_SVG = fujiLogo,
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
