import { AbstractVault, Currency, LendingVault } from '@x-fuji/sdk';

import { Mode } from '../../helpers/assets';
import { initialSharedState, SharedActions, SharedState } from './state';

export type LendState = Omit<SharedState, 'activeVault'> & {
  activeVault: LendingVault | undefined;
};

type LendActions = SharedActions & {
  changeAll: (vault: AbstractVault, collateral: Currency) => void;
};

export type LendStore = LendState & LendActions;

export const initialLendState: LendState = {
  ...initialSharedState,
  activeVault: undefined,
  mode: Mode.DEPOSIT,
};