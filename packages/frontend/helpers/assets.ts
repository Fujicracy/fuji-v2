import {
  ChainId,
  Currency,
  FujiResultPromise,
  FujiResultSuccess,
  OperationType,
} from '@x-fuji/sdk';

import {
  DEFAULT_CHAIN_ID,
  DUST_AMOUNT,
  LTV_RECOMMENDED_DECREASE,
  NOTIFICATION_MESSAGES,
} from '../constants';
import { sdk } from '../services/sdk';
import { AssetMeta } from '../store/models/Position';
import { notify } from './notifications';
import { BasePosition } from './positions';
import { fetchRoutes } from './routes';

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
  Loading,
  Ready,
  Error,
}

export enum AllowanceStatus {
  Initial,
  Loading,
  Ready,
  Error,
  Approving,
  Unneeded,
}

export type Allowance = {
  status: AllowanceStatus;
  value?: number;
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

export const foundCurrency = (
  selectable: Currency[],
  updated?: Currency
): Currency | undefined => {
  return updated && selectable.find((c) => c.symbol === updated.symbol);
};

export const defaultCurrency = (
  selectable: Currency[],
  updated?: Currency
): Currency => {
  return foundCurrency(selectable, updated) || selectable[0];
};

export const defaultAssetForType = (type: AssetType): AssetChange => {
  const defaultCurrencies =
    type === AssetType.Debt
      ? defaultDebtCurrencies
      : defaultCollateralCurrencies;
  return assetForData(
    DEFAULT_CHAIN_ID,
    defaultCurrencies,
    defaultCurrency(defaultCurrencies)
  );
};

export const debtForCurrency = (currency: Currency): AssetChange => {
  const debts = sdk.getDebtForChain(currency.chainId);
  return assetForData(currency.chainId, debts, currency);
};

export const assetForData = (
  chainId: ChainId,
  selectableCurrencies: Currency[],
  currency: Currency
): AssetChange => {
  return {
    selectableCurrencies,
    balances: {},
    input: '',
    chainId,
    allowance: {
      status: AllowanceStatus.Initial,
      value: undefined,
    },
    currency,
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

export const ltvMeta = (basePosition?: BasePosition): LtvMeta | undefined => {
  if (!basePosition?.position) return undefined;
  const { position, editedPosition } = basePosition;
  return {
    ltv: editedPosition ? editedPosition.ltv : position.ltv,
    ltvMax: position.ltvMax,
    ltvThreshold: editedPosition
      ? editedPosition.ltvThreshold
      : position.ltvThreshold,
  };
};

export const withdrawMaxAmount = async (
  mode: Mode.PAYBACK_AND_WITHDRAW | Mode.WITHDRAW,
  basePosition: BasePosition,
  debt: AssetChange,
  collateral: AssetChange
): FujiResultPromise<number> => {
  // if price is too high as for BTC, deduct less
  const significance = basePosition.position.collateral.usdPrice / 10000 + 1;
  const deductedCollateral = Math.max(
    0,
    basePosition.position.collateral.amount -
      DUST_AMOUNT / Math.pow(10, significance)
  );

  let debtAmount = (
    basePosition.editedPosition
      ? basePosition.editedPosition.debt
      : basePosition.position.debt
  ).amount;

  // In the case of PAYBACK_AND_WITHDRAW mode when the operation is cross-chain and
  // the vault is on the destination chain, we need to take into account the fees and
  // the slippage.
  if (mode === Mode.PAYBACK_AND_WITHDRAW) {
    let failed;

    if (basePosition.position.vault) {
      // Fetch metadata for the operation:
      // we only need estimateSlippage, bridgeFees and steps
      const response = await fetchRoutes(
        mode,
        basePosition.position.vault,
        collateral.currency,
        debt.currency,
        // we don't care about the collateral input
        '1',
        debt.input,
        // we don't care about account
        '0x0000000000000000000000000000000000000000',
        false,
        0
      );
      if (response.success) {
        const { bridgeFees, estimateSlippage, steps } = response.data;
        const r = sdk.previews.getOperationTypeFromSteps(steps);
        if (
          r.success &&
          (r.data === OperationType.THREE_CHAIN ||
            r.data === OperationType.TWO_CHAIN_VAULT_ON_DEST) &&
          bridgeFees &&
          estimateSlippage
        ) {
          const deltaDebt =
            bridgeFees[0].amount + debtAmount * (estimateSlippage / 100);
          // add to the current debt input so that the calculated withdrawing amount is smaller
          debtAmount += deltaDebt;
        } else if (!r.success) {
          failed = true;
        }
      } else {
        failed = true;
      }
    } else {
      failed = true;
    }
    if (failed) {
      notify({
        type: 'error',
        message: NOTIFICATION_MESSAGES.ONCHAIN_FAILURE,
      });
    }
  }

  const ltvMax = basePosition.position.ltvMax;
  const currentLtvMax = ltvMax > 1 ? ltvMax / 100 : ltvMax;

  const amount =
    deductedCollateral -
    debtAmount / (currentLtvMax * basePosition.position.collateral.usdPrice);

  return new FujiResultSuccess(amount);
};
