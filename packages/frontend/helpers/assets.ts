import {
  ChainId,
  FujiResultPromise,
  FujiResultSuccess,
  OperationType,
  Token,
} from '@x-fuji/sdk';

import {
  DUST_AMOUNT,
  LTV_RECOMMENDED_DECREASE,
  NOTIFICATION_MESSAGES,
} from '../constants';
import { sdk } from '../services/sdk';
import { AssetMeta } from '../store/models/Position';
import { BasePosition } from './positions';
import { TransactionMeta } from './transactions';
import { validAmount } from './values';
import { notify } from './notifications';
import { fetchRoutes } from './routing';
import { useBorrow } from '../store/borrow.store';
import { useAuth } from '../store/auth.store';

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

export const withdrawMaxAmount = async (
  basePosition: BasePosition,
  mode: Mode
): FujiResultPromise<{ collateral: number; debt?: number }> => {
  const deductedCollateral = Math.max(
    0,
    basePosition.position.collateral.amount - DUST_AMOUNT / 100
  );

  let debtAmount = (
    basePosition.editedPosition
      ? basePosition.editedPosition.debt
      : basePosition.position.debt
  ).amount;

  if (mode === Mode.PAYBACK_AND_WITHDRAW) {
    let failed = true;

    // Get the data statically from the stores directly, no point passing everything around
    const { activeVault, availableVaults, collateral, debt, mode, slippage } =
      useBorrow.getState();
    const address = useAuth.getState().address;
    if (activeVault && address) {
      // Fetch metadata for the operation
      const response = await fetchRoutes(
        mode,
        activeVault,
        collateral.token,
        debt.token,
        collateral.input, // TODO:
        debt.input, // TODO:
        address,
        availableVaults.indexOf(activeVault) === 0,
        slippage
      );
      if (response.success) {
        const r = sdk.previews.getOperationTypeFromSteps(response.data.steps);
        if (
          r.success &&
          (r.data === OperationType.THREE_CHAIN ||
            r.data === OperationType.TWO_CHAIN_VAULT_ON_DEST) &&
          response.data.bridgeFees &&
          response.data.estimateSlippage
        ) {
          const { bridgeFees, estimateSlippage } = response.data;
          const deltaDebt =
            bridgeFees[0].amount + debtAmount * (estimateSlippage / 100);
          // add to the current debt input so that the calculated withdrawing amount is smaller
          debtAmount += deltaDebt;
          // We got to the end, mark as success
          failed = false;
          // TODO: Depending on a condition, we need to call the function again, so we need to take part of the above to a different function
        }
      }
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

  return new FujiResultSuccess({ collateral: amount, debt: debtAmount });
};
