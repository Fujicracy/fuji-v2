import { VaultType } from '@x-fuji/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { fetchMarkets } from '../helpers/markets';
import { storeOptions } from '../helpers/stores';
import { initialMarketsState, MarketsStore } from './types/markets';

export const useMarkets = create<MarketsStore>()(
  devtools(
    (set, get, api) => ({
      ...initialMarketsState,

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
