import { AbstractVault, Currency, LendingVault } from '@x-fuji/sdk';

import { initialSharedState, SharedActions, SharedState } from './state';

export type LendState = Omit<SharedState, 'activeVault'> & {
  activeVault: LendingVault | undefined;
};

export type LendActions = SharedActions & {
  changeAll: (vault: AbstractVault, collateral: Currency) => void;
};

export type LendStore = LendState & LendActions;

export const initialLendState: LendState = {
  ...initialSharedState,
  activeVault: undefined,
};
