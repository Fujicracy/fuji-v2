import { Address } from '@x-fuji/sdk';
import { debounce } from 'debounce';
import { setAutoFreeze } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import { TRANSACTION_META_DEBOUNCE_INTERVAL } from '../constants';
import { AssetType, FetchStatus } from '../helpers/assets';
import { storeOptions } from '../helpers/stores';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import {
  allow,
  changeActiveVault,
  changeAll,
  changeAllowance,
  changeAssetChain,
  changeAssetCurrency,
  changeAssetValue,
  changeBalances,
  changeFormType,
  changeMode,
  changeSlippageValue,
  changeTransactionMeta,
  execute,
  sign,
  signAndExecute,
  updateAllowance,
  updateBalances,
  updateCurrencyPrice,
  updateMeta,
  updateTransactionMeta,
} from './shared/actions';
import { initialLendState, LendStore } from './shared/lend';

setAutoFreeze(false);

export const useLend = create<LendStore>()(
  persist(
    devtools(
      (set, get, api) => ({
        ...initialLendState,

        assetForType() {
          return get().collateral;
        },

        changeActiveVault(vault) {
          changeActiveVault(api, vault);
        },

        async changeAll(vault, collateral) {
          changeAll(api, vault, collateral);
        },

        async changeAllowance(type, status, amount) {
          changeAllowance(api, type, status, amount);
        },

        changeAssetChain(type, chainId, updateVault, currency) {
          changeAssetChain(api, type, chainId, updateVault, currency);
        },

        changeAssetCurrency(type, currency, updateVault) {
          changeAssetCurrency(api, type, currency, updateVault);
        },

        changeAssetValue(type, value) {
          changeAssetValue(api, type, value);
        },

        async changeBalances(type, balances) {
          changeBalances(api, type, balances);
        },

        async changeFormType(formType) {
          changeFormType(api, formType);
        },

        async changeInputValue(collateral) {
          await get().changeAssetValue(AssetType.Collateral, collateral);
        },

        async changeMode(mode) {
          changeMode(api, mode);
        },

        changeSlippageValue(slippage) {
          changeSlippageValue(api, slippage);
        },

        changeTransactionMeta(route) {
          changeTransactionMeta(api, route);
        },

        clearInputValues() {
          get().changeInputValue('');
        },

        async updateAll(vaultAddress) {
          await get().updateBalances(AssetType.Collateral);
          await get().updateAllowance(AssetType.Collateral);
          await get().updateVault(vaultAddress);
        },

        async updateAllowance(type) {
          updateAllowance(api, type);
        },

        async updateBalances(type) {
          updateBalances(api, type);
        },

        async updateCurrencyPrice(type) {
          updateCurrencyPrice(api, type);
        },

        async updateMeta(type, updateVault, updateBalance) {
          updateMeta(api, type, updateVault, updateBalance);
        },

        async updateTransactionMeta() {
          updateTransactionMeta(api);
        },

        updateTransactionMetaDebounced: debounce(
          () => get().updateTransactionMeta(),
          TRANSACTION_META_DEBOUNCE_INTERVAL
        ),

        async updateVault(vaultAddress) {
          set({ availableVaultsStatus: FetchStatus.Loading });

          const collateral = get().collateral.currency;
          const addr = useAuth.getState().address;
          const account = addr ? Address.from(addr) : undefined;

          const result = await sdk.getLendingVaultsFor(collateral, account);

          if (!result.success) {
            console.error(result.error.message);
            set({ availableVaultsStatus: FetchStatus.Error });
            return;
          }
          // check if currencies already changed before the previous async call completed
          if (!collateral.equals(get().collateral.currency)) {
            await get().updateVault();
            return;
          }

          const availableVaults = result.data;

          if (availableVaults.length === 0) {
            console.error('No available vault');
            set({ availableVaultsStatus: FetchStatus.Error });
            return;
          }

          const activeVault =
            availableVaults.find(
              (v) => v.vault.address.value === vaultAddress
            ) ?? availableVaults[0];

          set({ availableVaults });
          get().changeActiveVault(activeVault);

          get().updateTransactionMeta();
          set({ availableVaultsStatus: FetchStatus.Ready });
        },

        async allow(type) {
          allow(api, type);
        },

        async sign() {
          await sign(api);
        },

        async execute() {
          return await execute(api);
        },

        async signAndExecute() {
          await signAndExecute(api);
        },
      }),
      storeOptions('lend')
    ),
    {
      name: 'xFuji/borrow',
      partialize: (state) => ({ slippage: state.slippage }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            return console.error('an error happened during hydration', error);
          }
          if (!state) {
            return console.error('no state');
          }
        };
      },
    }
  )
);
