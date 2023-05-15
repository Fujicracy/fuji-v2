import { ChainId, Currency } from '@x-fuji/sdk';

import { DEFAULT_CHAIN_ID, LTV_RECOMMENDED_DECREASE } from '../constants';
import { sdk } from '../services/sdk';
import { AssetMeta } from '../store/models/Position';

const defaultDebtCurrencies = sdk.getDebtForChain(DEFAULT_CHAIN_ID);
const defaultCollateralCurrencies = sdk.getCollateralForChain(DEFAULT_CHAIN_ID);

export enum Mode {
  DEPOSIT_AND_BORROW, // addPosition: both collateral and debt
  PAYBACK_AND_WITHDRAW, // removePosition: both collateral and debt
  DEPOSIT, // addPosition: collateral
  BORROW, //addPosition: debt
  WITHDRAW, // removePosition: collateral
  PAYBACK, // removePosition: debt
}

export enum AssetType {
  Debt = 'debt',
  Collateral = 'collateral',
}

export enum FetchStatus {
  Initial,
  Fetching,
  Ready,
  Error,
}

export enum AllowanceStatus {
  Initial,
  Fetching,
  Ready,
  Error,
  Approving,
  Unneeded,
}

export type Allowance = {
  status: AllowanceStatus;
  value: number | undefined;
};

export type AssetChange = {
  selectableCurrencies: Currency[];
  balances: Record<string, number>;
  allowance: Allowance;
  input: string;
  chainId: ChainId;
  currency: Currency;
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

export const defaultCurrency = (
  currencies: Currency[],
  symbol?: string
): Currency => {
  return (
    (symbol && currencies.find((c) => c.symbol === symbol)) || currencies[0]
  );
};

export const defaultAssetForType = (type: AssetType): AssetChange => {
  const defaultCurrencies =
    type === AssetType.Debt
      ? defaultDebtCurrencies
      : defaultCollateralCurrencies;
  return {
    selectableCurrencies: defaultCurrencies,
    balances: {},
    input: '',
    chainId: DEFAULT_CHAIN_ID,
    allowance: {
      status: AllowanceStatus.Initial,
      value: undefined,
    },
    currency: defaultCurrency(defaultCurrencies),
    amount: 0,
    usdPrice: 0,
  };
};

export const recommendedLTV = (ltvMax: number): number => {
  return ltvMax > 20 ? ltvMax - LTV_RECOMMENDED_DECREASE : 0;
};

export const needsAllowance = (
  mode: Mode,
  type: AssetType,
  asset: AssetChange,
  amount: number
): boolean => {
  if (asset.allowance.status === AllowanceStatus.Unneeded) {
    return false;
  }
  return (
    (type === AssetType.Debt
      ? mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW
      : mode === Mode.DEPOSIT || mode === Mode.DEPOSIT_AND_BORROW) &&
    asset.allowance.value !== undefined &&
    asset.allowance.value < amount
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
