import { BorrowingVault, Currency } from '@x-fuji/sdk';

import { DEFAULT_LTV_MAX, DEFAULT_LTV_THRESHOLD } from '../../constants';
import {
  AssetChange,
  LiquidationMeta,
  LtvMeta,
  Mode,
} from '../../helpers/assets';
import { initialSharedState, SharedActions, SharedState } from './state';

export type BorrowState = Omit<SharedState, 'activeVault'> & {
  activeVault: BorrowingVault | undefined;
  debt?: AssetChange;

  ltv: LtvMeta;
  liquidationMeta: LiquidationMeta;
};

type BorrowActions = SharedActions & {
  changeAll: (
    vault: BorrowingVault,
    collateral: Currency,
    debt: Currency
  ) => void;
  changeDebt: (debt: AssetChange) => void;
  changeInputValues: (collateral: string, debt: string) => void;
  clearDebt: () => void;
  updateLiquidation: () => void;
  updateLtv: () => void;
};

export type BorrowStore = BorrowState & BorrowActions;

export const initialBorrowState: BorrowState = {
  ...initialSharedState,
  activeVault: undefined,
  mode: Mode.DEPOSIT_AND_BORROW,
  debt: undefined,
  ltv: {
    ltv: 0,
    ltvMax: DEFAULT_LTV_MAX,
    ltvThreshold: DEFAULT_LTV_THRESHOLD,
  },
  liquidationMeta: {
    liquidationPrice: 0,
    liquidationDiff: 0,
  },
};
