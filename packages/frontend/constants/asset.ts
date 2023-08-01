import { ethers } from 'ethers';

export enum Ltv {
  MAX = 75,
  THRESHOLD = 100,
  RISK = 10,
  DECREASE = 20,
}

export const MINIMUM_DEBT_AMOUNT = 1;

export const DUST_AMOUNT = 0.0001;
export const DUST_AMOUNT_IN_WEI = ethers.utils.parseUnits(
  String(DUST_AMOUNT),
  'ether'
);
