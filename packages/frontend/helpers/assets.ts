import { ChainId, Token } from '@x-fuji/sdk';

import { LTV_RECOMMENDED_DECREASE } from '../constants';

export enum Mode {
  DEPOSIT_AND_BORROW, // addPosition: both collateral and debt
  PAYBACK_AND_WITHDRAW, // removePosition: both collateral and debt
  DEPOSIT, // addPosition: collateral
  BORROW, //addPosition: debt
  WITHDRAW, // removePosition: collateral
  PAYBACK, // removePosition: debt
}

export type AssetType = 'debt' | 'collateral';

export type AllowanceStatus =
  | 'initial'
  | 'fetching'
  | 'allowing'
  | 'ready'
  | 'error';

export type Allowance = {
  status: AllowanceStatus;
  value: number | undefined;
};

export type AssetChange = {
  selectableTokens: Token[];
  balances: Record<string, number>;
  allowance: Allowance;
  input: string;
  chainId: ChainId;
  token: Token;
  amount: number;
  usdPrice: number;
};

export type LtvMeta = {
  ltv: number;
  ltvMax: number;
  ltvThreshold: number;
};

export type LiquidationMeta = {
  liquidationPrice: number;
  liquidationDiff: number;
};

export enum ActionType {
  ADD = 0,
  REMOVE = 1,
}

export const recommendedLTV = (ltvMax: number): number => {
  return ltvMax > 20 ? ltvMax - LTV_RECOMMENDED_DECREASE : 0;
};

export const needsAllowance = (
  mode: Mode,
  type: AssetType,
  asset: AssetChange,
  amount: number
): boolean => {
  return (
    (type === 'debt'
      ? mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW
      : mode === Mode.DEPOSIT || mode === Mode.DEPOSIT_AND_BORROW) &&
    asset.allowance?.value !== undefined &&
    asset.allowance?.value < amount
  );
};

export const borrowLimit = (
  mode: Mode,
  balance: number,
  input: number,
  price: number,
  maxLtv: number
): number => {
  const amount =
    mode === Mode.WITHDRAW ||
    mode === Mode.PAYBACK ||
    mode === Mode.PAYBACK_AND_WITHDRAW
      ? balance - input
      : balance + input;
  const value = (amount * price * maxLtv) / 100;
  return value > 0 ? value : 0;
};
