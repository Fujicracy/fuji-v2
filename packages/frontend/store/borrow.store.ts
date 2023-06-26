import { Address } from '@x-fuji/sdk';
import { debounce } from 'debounce';
import produce, { setAutoFreeze } from 'immer';
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
import { BorrowState, BorrowStore, initialBorrowState } from './shared/borrow';

setAutoFreeze(false);

export const useBorrow = create<BorrowStore>()(
  persist(
    devtools(
      (set, get, api) => ({
        ...initialBorrowState,

        assetForType(type) {
          return type === AssetType.Collateral ? get().collateral : get().debt;
        },

        changeActiveVault(vault) {
          changeActiveVault(api, vault);
        },

        async changeAll(vault, collateral, debt) {
          changeAll(api, vault, collateral, debt);
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

        async changeDebt(debt) {
          set({ debt });
        },

        async changeFormType(formType) {
          changeFormType(api, formType);
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

        async clearDebt() {
          set({ debt: undefined });
        },

        async clearInputValues() {
          await get().changeAssetValue(AssetType.Collateral, '');
          await get().changeAssetValue(AssetType.Debt, '');
        },

        async updateAll(vaultAddress) {
          await get().updateBalances(AssetType.Collateral);
          await get().updateBalances(AssetType.Debt);
          await get().updateAllowance(AssetType.Collateral);
          await get().updateAllowance(AssetType.Debt);
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

        updateLiquidation() {
          const debt = get().debt;
          if (!debt) return;
          const collateralAmount = parseFloat(get().collateral.input);
          const collateralPrice = get().collateral.usdPrice;

          const debtAmount = parseFloat(debt.input);
          const debtPrice = debt.usdPrice;
          const debtValue = debtAmount * debtPrice;

          if (!debtValue || !collateralAmount) {
            return set(
              produce((s: BorrowState) => {
                s.liquidationMeta.liquidationPrice = 0;
                s.liquidationMeta.liquidationDiff = 0;
              })
            );
          }

          const liquidationThreshold = get().ltv.ltvThreshold;

          const liquidationPrice =
            debtValue / (collateralAmount * (liquidationThreshold / 100));
          const liquidationDiff = Math.round(
            (1 - liquidationPrice / collateralPrice) * 100
          );

          set(
            produce((s: BorrowState) => {
              s.liquidationMeta.liquidationPrice = liquidationPrice;
              s.liquidationMeta.liquidationDiff = liquidationDiff;
            })
          );
        },

        updateLtv() {
          const debt = get().debt;
          if (!debt) return;
          const collateralAmount = parseFloat(get().collateral.input);
          const collateralPrice = get().collateral.usdPrice;
          const collateralValue = collateralAmount * collateralPrice;

          const debtAmount = parseFloat(debt.input);
          const debtPrice = debt.usdPrice;
          const debtValue = debtAmount * debtPrice;

          const ltv =
            collateralValue && debtValue
              ? Math.round((debtValue / collateralValue) * 100)
              : 0;

          set(
            produce((s: BorrowState) => {
              s.ltv.ltv = ltv;
            })
          );
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
          const debt = get().debt?.currency;
          if (!debt) return;
          set({ availableVaultsStatus: FetchStatus.Loading });

          const collateral = get().collateral.currency;
          const addr = useAuth.getState().address;
          const account = addr ? Address.from(addr) : undefined;

          const result = await sdk.getBorrowingVaultsFor(
            collateral,
            debt,
            account
          );

          if (!result.success) {
            console.error(result.error.message);
            set({ availableVaultsStatus: FetchStatus.Error });
            return;
          }
          // check if currencies already changed before the previous async call completed
          const currentDebt = get().debt;
          if (
            !collateral.equals(get().collateral.currency) ||
            (currentDebt && !debt.equals(currentDebt.currency))
          ) {
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
      storeOptions('borrow')
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
