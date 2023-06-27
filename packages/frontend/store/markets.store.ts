import {
  AbstractVault,
  BorrowingVault,
  LendingVault,
  VaultType,
} from '@x-fuji/sdk';
import produce from 'immer';
import { create, StoreApi as ZustandStoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';

import { fetchMarkets, MarketRow } from '../helpers/markets';
import { storeOptions } from '../helpers/stores';
import { FinancialsOrError } from '../helpers/vaults';

type MarketData = {
  rows: MarketRow[];
  vaults: BorrowingVault[];
  vaultsWithFinancials: FinancialsOrError[];
};

type BorrowData = Omit<MarketData, 'vaults'> & {
  vaults: BorrowingVault[];
};

type LendingData = Omit<MarketData, 'vaults'> & {
  vaults: LendingVault[];
};

type MarketsState = {
  borrow: BorrowData;
  lending: LendingData;
  loading: boolean;
};

type MarketsActions = {
  fetchMarkets: (addr?: string) => void;

  changeRows: (type: VaultType, rows: MarketRow[]) => void;
  changeRowsAndFinancials: (
    type: VaultType,
    rows: MarketRow[],
    vaultsWithFinancials: FinancialsOrError[]
  ) => void;
  changeRowsIfNeeded: (type: VaultType, rows: MarketRow[]) => void;
  changeVaults: (type: VaultType, vaults: AbstractVault[]) => void;
  changeVaultsWithFinancials: (
    type: VaultType,
    vaultsWithFinancials: FinancialsOrError[]
  ) => void;

  vaultsWithFinancials: (type: VaultType) => FinancialsOrError[];
};

export type MarketsApi = ZustandStoreApi<MarketsStore>;

const initialDataState = {
  rows: [],
  vaults: [],
  vaultsWithFinancials: [],
};

const initialState: MarketsState = {
  borrow: initialDataState,
  lending: initialDataState,
  loading: false,
};

export type MarketsStore = MarketsState & MarketsActions;

export const useMarkets = create<MarketsStore>()(
  devtools(
    (set, get, api) => ({
      ...initialState,

      fetchMarkets: async (address) => {
        set({ loading: true });
        await fetchMarkets(VaultType.BORROW, api, address);
        await fetchMarkets(VaultType.LEND, api, address);
        set({ loading: false });
      },

      changeRows(type, rows) {
        set(
          produce((state) => {
            if (type === VaultType.BORROW) {
              state.borrow.rows = rows;
            } else {
              state.lending.rows = rows;
            }
          })
        );
      },

      changeRowsAndFinancials(type, rows, vaultsWithFinancials) {
        get().changeRows(type, rows);
        get().changeVaultsWithFinancials(type, vaultsWithFinancials);
      },

      changeRowsIfNeeded(type, rows) {
        const data = type === VaultType.BORROW ? get().borrow : get().lending;
        if (data.rows.length === 0) {
          get().changeRows(type, rows);
        }
      },

      changeVaults(type, vaults) {
        set(
          produce((state) => {
            if (type === VaultType.BORROW) {
              state.borrow.vaults = vaults;
            } else if (type === VaultType.LEND) {
              state.lending.vaults = vaults;
            }
          })
        );
      },

      changeVaultsWithFinancials(type, vaultsWithFinancials) {
        set(
          produce((state) => {
            if (type === VaultType.BORROW) {
              state.borrow.vaultWithFinancials = vaultsWithFinancials;
            } else if (type === VaultType.LEND) {
              state.lending.vaultWithFinancials = vaultsWithFinancials;
            }
          })
        );
      },

      vaultsWithFinancials(type) {
        return (type === VaultType.BORROW ? get().borrow : get().lending)
          .vaultsWithFinancials;
      },
    }),
    storeOptions('markets')
  )
);
