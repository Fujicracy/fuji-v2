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
import { useAuth } from './auth.store';

type MarketsState = {
  rows: MarketRow[];
  vaults: BorrowingVault[];
  vaultsWithFinancials: VaultWithFinancials[];
  loading: boolean;
};

type MarketsActions = {
  fetchMarkets: () => void;
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
    (set) => ({
      ...initialState,

      fetchMarkets: async () => {
        set({ loading: true });
        const vaults = sdk.getAllBorrowingVaults();

        const rowsBase = vaults.map(setBase);
        set({ vaults, rows: rowsBase });

        const address = useAuth.getState().address;
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
        const financials = result.data;
        const rowsFin = financials.map((fin, i) =>
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
