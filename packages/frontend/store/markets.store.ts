import { Address, BorrowingVault, FujiError } from '@x-fuji/sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { NOTIFICATION_MESSAGES } from '../constants';
import {
  FinancialsOrError,
  getAllBorrowingVaultFinancials,
  vaultsFromFinancialsOrError,
} from '../helpers/borrow';
import {
  MarketRow,
  MarketRowStatus,
  setBase,
  setBest,
  setFinancials,
  setLlamas,
} from '../helpers/markets';
import { notify } from '../helpers/notifications';
import { storeOptions } from '../helpers/stores';
import { sdk } from '../services/sdk';

type MarketsState = {
  rows: MarketRow[];
  vaults: BorrowingVault[];
  vaultsWithFinancials: FinancialsOrError[];
  loading: boolean;
};

type MarketsActions = {
  fetchMarkets: (addr?: string) => void;
};

const initialState: MarketsState = {
  rows: [],
  vaults: [],
  vaultsWithFinancials: [],
  loading: false,
};

export type MarketsStore = MarketsState & MarketsActions;

export const useMarkets = create<MarketsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchMarkets: async (address) => {
        set({ loading: true });
        const vaults = sdk.getAllBorrowingVaults();

        const rowsBase = vaults.map(setBase);
        set({ vaults });
        if (get().rows.length === 0) {
          set({ rows: rowsBase });
        }

        const result = await getAllBorrowingVaultFinancials(
          address ? Address.from(address) : undefined
        );
        const errors = result.data.filter((d) => d instanceof FujiError);
        const allVaults = vaultsFromFinancialsOrError(result.data);
        if (errors.length > 0) {
          notify({
            type: 'error',
            message: NOTIFICATION_MESSAGES.MARKETS_FAILURE,
          });
        }
        if (allVaults.length === 0) {
          const rows = rowsBase
            .map((r) => setFinancials(r, MarketRowStatus.Error))
            .map((r) => setLlamas(r, MarketRowStatus.Error));
          set({ rows: setBest(rows) });
        }

        const vaultsWithFinancials = result.data;
        const rowsFin = vaultsWithFinancials.map((obj, i) => {
          const fin = obj instanceof FujiError ? undefined : obj;
          const status =
            obj instanceof FujiError
              ? MarketRowStatus.Error
              : MarketRowStatus.Ready;
          return setFinancials(rowsBase[i], status, fin);
        });

        const currentFinancials = vaultsFromFinancialsOrError(
          get().vaultsWithFinancials
        );
        if (
          currentFinancials.length === 0 ||
          currentFinancials.length !== allVaults.length
        ) {
          set({ rows: setBest(rowsFin) });
          set({ vaultsWithFinancials });
        }

        const llamaResult = await sdk.getLlamaFinancials(allVaults);
        if (!llamaResult.success) {
          notify({
            type: 'error',
            message: llamaResult.error.message,
          });
          const rows = rowsFin.map((r) => setLlamas(r, MarketRowStatus.Error));
          set({ rows: setBest(rows) });
          return;
        }
        const vaultsWithLlamas = llamaResult.data;
        const rowsLlama = vaultsWithFinancials.map((obj, i) => {
          const llama =
            obj instanceof FujiError
              ? undefined
              : vaultsWithLlamas.find(
                  (l) => l.vault.address.value === obj.vault.address.value
                );
          return setLlamas(
            rowsFin[i],
            llama ? MarketRowStatus.Ready : MarketRowStatus.Error,
            llama
          );
        });
        set({
          rows: setBest(rowsLlama),
          vaultsWithFinancials: vaultsWithLlamas,
          loading: false,
        });
      },
    }),
    storeOptions('markets')
  )
);
