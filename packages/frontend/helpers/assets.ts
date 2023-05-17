import { ChainId, Token } from '@x-fuji/sdk';

import { DUST_AMOUNT, LTV_RECOMMENDED_DECREASE } from '../constants';
import { AssetMeta } from '../store/models/Position';
import { BasePosition } from './positions';
import { TransactionMeta, bridgeFeeSum } from './transactions';

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

export const maxBorrowLimit = (
  collateral: number,
  price: number,
  maxLtv: number
): number => {
  const value = (collateral * price * maxLtv) / 100;
  return value > 0 ? value : 0;
};

export const remainingBorrowLimit = (
  collateral: AssetMeta,
  debt: AssetMeta,
  maxLtv: number
): number => {
  const max = maxBorrowLimit(collateral.amount, collateral.usdPrice, maxLtv);
  return max - debt.amount * debt.usdPrice;
};

export const withdrawingCollateralMaxAmount = (
  basePosition: BasePosition,
  meta: TransactionMeta,
  mode: Mode
): number => {
  const deductedCollateral = Math.max(
    0,
    basePosition.position.collateral.amount - DUST_AMOUNT / 100
  );

  const debtAmount =
    (basePosition.editedPosition
      ? basePosition.editedPosition.debt
      : basePosition.position.debt
    ).amount -
    (mode === Mode.PAYBACK_AND_WITHDRAW &&
    meta.bridgeFees &&
    meta.estimateSlippage
      ? bridgeFeeSum(meta.bridgeFees) + meta.estimateSlippage // Conversion pending
      : 0);

  const ltvMax = basePosition.position.ltvMax;
  const currentLtvMax = ltvMax > 1 ? ltvMax / 100 : ltvMax;

  const amount =
    debtAmount / (currentLtvMax * basePosition.position.collateral.usdPrice);

  return amount;
};
