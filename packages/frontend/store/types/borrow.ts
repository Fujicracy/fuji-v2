import { BorrowingVault, Currency, VaultType } from '@x-fuji/sdk';

import { Ltv } from '../../constants';
import {
  AssetChange,
  AssetType,
  defaultAssetForType,
  LiquidationMeta,
  LtvMeta,
  Mode,
} from '../../helpers/assets';
import { initialSharedState, SharedActions, SharedState } from './state';

export type BorrowState = Omit<SharedState, 'activeVault'> & {
  activeVault: BorrowingVault | undefined;

  collateral: AssetChange;
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
  clearDebt: () => void;
  updateLiquidation: () => void;
  updateLtv: () => void;
};

export type BorrowStore = BorrowState & BorrowActions;

export const initialBorrowState: BorrowState = {
  ...initialSharedState,
  activeVault: undefined,
  mode: Mode.DEPOSIT_AND_BORROW,
  collateral: defaultAssetForType(AssetType.Collateral, VaultType.BORROW),
  debt: undefined,
  ltv: {
    ltv: 0,
    ltvMax: Ltv.MAX,
    ltvThreshold: Ltv.THRESHOLD,
  },
  liquidationMeta: {
    liquidationPrice: 0,
    liquidationDiff: 0,
  },
};
