import { AbstractVault, Currency } from '@x-fuji/sdk';

import { initialSharedState, SharedActions, SharedState } from './state';

export type LendState = SharedState;

export type LendActions = SharedActions & {
  changeAll: (vault: AbstractVault, collateral: Currency) => void;
  changeInputValue: (collateral: string) => void;
};

export type LendStore = LendState & LendActions;

export const initialLendState: LendState = {
  ...initialSharedState,
};
