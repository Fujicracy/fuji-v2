import { Address, BorrowingVault, VaultWithFinancials } from '@x-fuji/sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { NOTIFICATION_MESSAGES } from '../constants';
import { getAllBorrowingVaultFinancials } from '../helpers/borrow';
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
  vaultsWithFinancials: VaultWithFinancials[];
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

        if (result.errors.length > 0) {
          notify({
            type: 'error',
            message: NOTIFICATION_MESSAGES.MARKETS_FAILURE,
          });
        }
        if (result.data.length === 0) {
          const rows = rowsBase
            .map((r) => setFinancials(r, MarketRowStatus.Error))
            .map((r) => setLlamas(r, MarketRowStatus.Error));
          set({ rows: setBest(rows) });
          return;
        }

        const vaultsWithFinancials = result.data;
        const rowsFin = vaultsWithFinancials.map((fin, i) =>
          setFinancials(rowsBase[i], MarketRowStatus.Ready, fin)
        );
        set({ rows: setBest(rowsFin) });
        set({ vaultsWithFinancials });

        const llamaResult = await sdk.getLlamaFinancials(vaultsWithFinancials);
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
        const rowsLlama = vaultsWithLlamas.map((llama, i) =>
          setLlamas(rowsFin[i], MarketRowStatus.Ready, llama)
        );
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