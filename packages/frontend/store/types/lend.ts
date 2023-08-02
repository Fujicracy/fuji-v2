import { AbstractVault, Currency, LendingVault, VaultType } from '@x-fuji/sdk';

import {
  AssetChange,
  AssetType,
  defaultAssetForType,
  Mode,
} from '../../helpers/assets';
import { initialSharedState, SharedActions, SharedState } from './state';

export type LendState = Omit<SharedState, 'activeVault'> & {
  activeVault: LendingVault | undefined;

  collateral: AssetChange;
};

type LendActions = SharedActions & {
  changeAll: (vault: AbstractVault, collateral: Currency) => void;
};

export type LendStore = LendState & LendActions;

export const initialLendState: LendState = {
  ...initialSharedState,
  activeVault: undefined,
  collateral: defaultAssetForType(AssetType.Collateral, VaultType.LEND),
  mode: Mode.DEPOSIT,
};
