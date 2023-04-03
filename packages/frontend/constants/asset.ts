import { ethers } from 'ethers';

export const DEFAULT_LTV_MAX = 75;
export const DEFAULT_LTV_TRESHOLD = 100;
export const LTV_RECOMMENDED_DECREASE = 20;
export const MINIMUM_DEBT_AMOUNT = 1;

export const DUST_AMOUNT = 0.0001;
export const DUST_AMOUNT_IN_WEI = ethers.utils.parseUnits(
  String(DUST_AMOUNT),
  'ether'
);