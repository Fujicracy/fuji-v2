import {
  Address,
  BorrowingVault,
  ChainId,
  CONNEXT_ROUTER_ADDRESS,
  contracts,
  Currency,
  DEFAULT_SLIPPAGE,
  FujiError,
  FujiErrorCode,
  FujiResult,
  FujiResultError,
  FujiResultSuccess,
  LendingProviderWithFinancials,
  RouterActionParams,
  Sdk,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { debounce } from 'debounce';
import { BigNumber, ethers, Signature } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import produce, { setAutoFreeze } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import {
  DEFAULT_LTV_MAX,
  DEFAULT_LTV_THRESHOLD,
  NOTIFICATION_MESSAGES,
  TRANSACTION_META_DEBOUNCE_INTERVAL,
} from '../constants';
import {
  AllowanceStatus,
  AssetChange,
  assetForData,
  AssetType,
  defaultAssetForType,
  defaultCurrency,
  FetchStatus,
  foundCurrency,
  LiquidationMeta,
  LtvMeta,
  Mode,
} from '../helpers/assets';
import { fetchBalances } from '../helpers/balances';
import { isSupported, testChains } from '../helpers/chains';
import { isBridgeable } from '../helpers/currencies';
import { handleTransactionError } from '../helpers/errors';
import {
  dismiss,
  getTransactionLink,
  NotificationDuration,
  NotificationId,
  notify,
} from '../helpers/notifications';
import { fetchRoutes, RouteMeta } from '../helpers/routing';
import { storeOptions } from '../helpers/stores';
import { TransactionMeta } from '../helpers/transactions';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import { useHistory } from './history.store';

setAutoFreeze(false);

export enum FormType {
  Create,
  Edit,
}

type BorrowState = {
  formType: FormType;
  mode: Mode;

  availableVaults: VaultWithFinancials[];
  availableVaultsStatus: FetchStatus;

  activeVault: BorrowingVault | undefined;
  activeProvider: LendingProviderWithFinancials | undefined;
  allProviders: LendingProviderWithFinancials[] | [];

  collateral: AssetChange;
  debt?: AssetChange;

  ltv: LtvMeta;
  liquidationMeta: LiquidationMeta;

  slippage: number;

  transactionMeta: TransactionMeta;
  availableRoutes: RouteMeta[];

  needsSignature: boolean;
  isSigning: boolean;
  signature?: Signature;
  actions?: RouterActionParams[];

  isExecuting: boolean;

  allowChainOverride: boolean;
};

type BorrowActions = {
  assetForType: (type: AssetType) => AssetChange | undefined;
  changeFormType: (type: FormType) => void;
  changeMode: (mode: Mode) => void;
  changeAll: (
    collateral: Currency,
    debt: Currency,
    vault: BorrowingVault
  ) => void;
  clearDebt: () => void;
  changeInputValues: (collateral: string, debt: string) => void;
  changeAssetChain: (
    type: AssetType,
    chainId: ChainId,
    updateVault: boolean,
    currency?: Currency
  ) => void;
  changeAssetCurrency: (
    type: AssetType,
    currency: Currency,
    updateVault: boolean
  ) => void;
  changeAssetValue: (type: AssetType, value: string) => void;
  changeActiveVault: (v: VaultWithFinancials) => void;
  changeTransactionMeta: (route: RouteMeta) => void;
  changeSlippageValue: (slippage: number) => void;
  changeBalances: (type: AssetType, balances: Record<string, number>) => void;
  changeAllowance: (
    type: AssetType,
    status: AllowanceStatus,
    amount?: number
  ) => void;

  updateCurrencyPrice: (type: AssetType) => void;
  updateBalances: (type: AssetType) => void;
  updateAllowance: (type: AssetType) => void;
  updateVault: () => void;
  updateTransactionMeta: () => void;
  updateTransactionMetaDebounced: () => void;
  updateLtv: () => void;
  updateLiquidation: () => void;
  allow: (type: AssetType) => void;
  updateAvailableRoutes: (routes: RouteMeta[]) => void;
  sign: () => void;
  execute: () => Promise<ethers.providers.TransactionResponse | undefined>;
  signAndExecute: () => void;

  changeChainOverride: (allow: boolean) => void;
};

type BorrowStore = BorrowState & BorrowActions;

const initialState: BorrowState = {
  formType: FormType.Create,
  mode: Mode.DEPOSIT_AND_BORROW,

  availableVaults: [],
  availableVaultsStatus: FetchStatus.Initial,
  allProviders: [],

  activeVault: undefined,
  activeProvider: undefined,

  collateral: defaultAssetForType(AssetType.Collateral),
  debt: undefined,

  ltv: {
    ltv: 0,
    ltvMax: DEFAULT_LTV_MAX,
    ltvThreshold: DEFAULT_LTV_THRESHOLD,
  },

  slippage: DEFAULT_SLIPPAGE,

  liquidationMeta: {
    liquidationPrice: 0,
    liquidationDiff: 0,
  },

  transactionMeta: {
    status: FetchStatus.Initial,
    bridgeFees: undefined,
    gasFees: 0,
    estimateTime: 0,
    estimateSlippage: 0,
    steps: [],
  },
  availableRoutes: [],

  needsSignature: true,
  isSigning: false,
  isExecuting: false,

  allowChainOverride: true,
};

export const useBorrow = create<BorrowStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        assetForType(type) {
          return type === AssetType.Collateral ? get().collateral : get().debt;
        },

        async changeFormType(formType) {
          set({ formType });
        },

        async changeMode(mode) {
          set({ mode, needsSignature: false });
        },

        async updateAvailableRoutes(routes: RouteMeta[]) {
          set({ availableRoutes: routes });
        },

        async changeAll(collateral, debt, vault) {
          const collaterals = sdk.getCollateralForChain(collateral.chainId);
          const debts = sdk.getDebtForChain(debt.chainId);
          set(
            produce((state: BorrowState) => {
              state.activeVault = vault;

              state.collateral.chainId = collateral.chainId;
              state.collateral.selectableCurrencies = collaterals;
              state.collateral.currency = collateral;

              if (!state.debt)
                state.debt = assetForData(debt.chainId, debts, debt);
              else {
                state.debt.chainId = debt.chainId;
                state.debt.selectableCurrencies = debts;
                state.debt.currency = debt;
              }
            })
          );

          get().updateCurrencyPrice(AssetType.Collateral);
          get().updateCurrencyPrice(AssetType.Debt);
          get().updateBalances(AssetType.Collateral);
          get().updateBalances(AssetType.Debt);
          get().updateAllowance(AssetType.Collateral);
          get().updateAllowance(AssetType.Debt);

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
          const availableVaults = result.data;
          set({ availableVaults });

          const e = availableVaults.find(
            (r) => r.vault.address === vault.address
          );
          if (!e) {
            console.error('Vault not found');
            set({ availableVaultsStatus: FetchStatus.Error });
            return;
          }

          get().changeActiveVault(e);

          get().updateTransactionMeta();
          set({ availableVaultsStatus: FetchStatus.Ready });
        },

        async clearDebt() {
          set({ debt: undefined });
        },

        async changeInputValues(collateral, debt) {
          await Promise.all([
            get().changeAssetValue(AssetType.Collateral, collateral),
            get().changeAssetValue(AssetType.Debt, debt),
          ]);
        },

        changeAssetChain(type, chainId, updateVault, currency) {
          console.log('changeAssetChain', type, chainId, updateVault, currency);
          if (!isSupported(chainId)) return;

          const currencies =
            type === AssetType.Debt
              ? sdk.getDebtForChain(chainId)
              : sdk.getCollateralForChain(chainId);

          if (
            get().formType === FormType.Edit &&
            currency &&
            (!isBridgeable(currency) ||
              !currencies.find((c) => c.symbol === currency.symbol))
          ) {
            notify({
              type: 'error',
              message: `${currency.symbol} not supported cross-chain.`,
            });
            return;
          }
          set(
            produce((state: BorrowState) => {
              let t = type === AssetType.Debt ? state.debt : state.collateral;
              if (!t)
                t = assetForData(
                  chainId,
                  currencies,
                  defaultCurrency(currencies)
                );
              else {
                t.chainId = chainId;
                t.selectableCurrencies = currencies;
                const found = foundCurrency(t.selectableCurrencies, t.currency);
                if (found) t.currency = found;
                else if (state.formType === FormType.Create)
                  t.currency = currencies[0];
              }
            })
          );
          get().updateCurrencyPrice(type);
          get().updateBalances(type);

          if (updateVault) {
            get().updateVault();
          } else {
            get().updateTransactionMeta();
          }

          get().updateAllowance(type);
        },

        changeAssetCurrency(type, currency, updateVault) {
          set(
            produce((state: BorrowState) => {
              if (type === AssetType.Collateral) {
                state.collateral.currency = currency;
              } else if (state.debt) {
                state.debt.currency = currency;
              }
            })
          );
          get().updateCurrencyPrice(type);
          if (updateVault) {
            get().updateVault();
          }
          get().updateAllowance(type);
        },

        changeAssetValue(type, value) {
          set(
            produce((state: BorrowState) => {
              if (type === AssetType.Collateral) {
                state.collateral.input = value;
              } else if (state.debt) {
                state.debt.input = value;
              }
            })
          );
          get().updateTransactionMetaDebounced();
          get().updateLtv();
          get().updateLiquidation();
        },

        changeSlippageValue(slippage) {
          set({ slippage });
        },

        changeActiveVault({
          vault,
          activeProvider,
          allProviders,
          depositBalance,
          borrowBalance,
        }) {
          const ltvMax = vault.maxLtv
            ? parseInt(formatUnits(vault.maxLtv, 16))
            : DEFAULT_LTV_MAX;
          const ltvThreshold = vault.liqRatio
            ? parseInt(formatUnits(vault.liqRatio, 16))
            : DEFAULT_LTV_THRESHOLD;

          set(
            produce((s: BorrowState) => {
              s.activeVault = vault;
              s.activeProvider = activeProvider;
              s.allProviders = allProviders;
              s.ltv.ltvMax = ltvMax;
              s.ltv.ltvThreshold = ltvThreshold;
              const dec = vault.collateral.decimals;
              s.collateral.amount = parseFloat(
                formatUnits(depositBalance, dec)
              );

              if (!s.debt) return;
              const dec2 = s.debt.currency.decimals;
              s.debt.amount = parseFloat(formatUnits(borrowBalance, dec2));
            })
          );
          const route = get().availableRoutes.find(
            (r) => r.address === vault.address.value
          );
          if (route) {
            get().changeTransactionMeta(route);
          }
        },

        changeTransactionMeta(route) {
          set(
            produce((state: BorrowState) => {
              state.transactionMeta.status = FetchStatus.Ready;
              state.needsSignature = Sdk.needSignature(route.actions);
              state.transactionMeta.bridgeFees = route.bridgeFees;
              state.transactionMeta.estimateTime = route.estimateTime;
              state.transactionMeta.steps = route.steps;
              state.actions = route.actions;
              state.transactionMeta.estimateSlippage = route.estimateSlippage;
            })
          );
        },

        async updateBalances(type) {
          const address = useAuth.getState().address;
          const asset = get().assetForType(type);
          if (!address || !asset) {
            return;
          }

          const currencies = asset.selectableCurrencies;
          const currency = asset.currency;
          const chainId = currency.chainId;
          const result = await fetchBalances(currencies, address, chainId);
          if (!result.success) {
            console.error(result.error.message);
            return;
          }
          const currentAsset = get().assetForType(type);
          if (!currentAsset) return; // TODO: handle this case?
          const currentCurrency = currentAsset.currency;
          if (
            currency.address !== currentCurrency.address ||
            currency.chainId !== currentCurrency.chainId
          )
            return;
          const balances = result.data;
          get().changeBalances(type, balances);
        },

        async changeBalances(type, balances) {
          set(
            produce((state: BorrowState) => {
              if (type === AssetType.Collateral) {
                state.collateral.balances = balances;
              } else if (state.debt) {
                state.debt.balances = balances;
              }
            })
          );
        },

        async changeAllowance(type, status, amount) {
          set(
            produce((s: BorrowState) => {
              if (type === AssetType.Collateral) {
                s.collateral.allowance.status = status;
                if (amount !== undefined) s.collateral.allowance.value = amount;
              } else if (s.debt) {
                s.debt.allowance.status = status;
                if (amount !== undefined) s.debt.allowance.value = amount;
              }
            })
          );
        },

        async updateCurrencyPrice(type) {
          const asset = get().assetForType(type);
          if (!asset) return;
          const currency = asset.currency;

          const result = await currency.getPriceUSD();
          if (!result.success) {
            console.error(result.error.message);
            return;
          }

          const currentCurrency = get().assetForType(type)?.currency;
          if (!currentCurrency || currency.address !== currentCurrency.address)
            return;

          let currencyValue = result.data;
          const isTestNet = testChains.some(
            (c) => c.chainId === currency.chainId
          );
          if (currency.symbol === 'WETH' && isTestNet) {
            currencyValue = 1242.42; // fix bc weth has no value on testnet
          }

          set(
            produce((state: BorrowState) => {
              if (type === AssetType.Collateral) {
                state.collateral.usdPrice = currencyValue;
              } else if (state.debt) {
                state.debt.usdPrice = currencyValue;
              }
            })
          );
          get().updateLtv();
          get().updateLiquidation();
        },

        async updateAllowance(type) {
          const asset = get().assetForType(type);
          if (!asset) return;
          const currency = asset.currency;
          const address = useAuth.getState().address;

          if (!address) {
            return;
          }
          if (currency.isNative) {
            get().changeAllowance(type, AllowanceStatus.Unneeded);
            return;
          }
          get().changeAllowance(type, AllowanceStatus.Loading);
          try {
            const res = await sdk.getAllowanceFor(
              currency,
              Address.from(address)
            );

            const currentCurrency = get().assetForType(type)?.currency;
            if (
              !currentCurrency ||
              currency.address !== currentCurrency.address ||
              currency.chainId !== currentCurrency.chainId
            )
              return;

            const value = parseFloat(formatUnits(res, currency.decimals));
            get().changeAllowance(type, AllowanceStatus.Ready, value);
          } catch (e) {
            // TODO: how to handle the case where we can't fetch allowance ?
            console.error(e);
            get().changeAllowance(type, AllowanceStatus.Error);
          }
        },

        async updateVault() {
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

          set({ availableVaults });
          get().changeActiveVault(availableVaults[0]);

          get().updateTransactionMeta();
          set({ availableVaultsStatus: FetchStatus.Ready });
        },

        async updateTransactionMeta() {
          const address = useAuth.getState().address;
          if (!address) {
            return;
          }

          const {
            activeVault,
            availableVaults,
            collateral,
            debt,
            mode,
            slippage,
          } = get();
          if (!debt) {
            return;
          }
          const collateralInput =
            collateral.input === '' ? '0' : collateral.input;
          const debtInput = debt.input === '' ? '0' : debt.input;
          if (!activeVault) {
            return set(
              produce((state: BorrowState) => {
                state.transactionMeta.status = FetchStatus.Error;
              })
            );
          }

          set(
            produce((state: BorrowState) => {
              state.transactionMeta.status = FetchStatus.Loading;
              state.signature = undefined;
              state.actions = undefined;
            })
          );

          try {
            const formType = get().formType;
            // when editing a position, we need to fetch routes only for the active vault
            const vaults =
              formType === FormType.Create && availableVaults.length > 0
                ? availableVaults.map((e) => e.vault)
                : [activeVault];

            const results = await Promise.all(
              vaults.map((v, i) => {
                const recommended = i === 0;

                return fetchRoutes(
                  mode,
                  v,
                  collateral.currency,
                  debt.currency,
                  collateralInput,
                  debtInput,
                  address,
                  recommended,
                  slippage
                );
              })
            );
            const error = results.find((r): r is FujiResultError => !r.success);
            if (error) {
              console.error(error);
              //throw error.error;
            }
            // filter valid routes
            const availableRoutes: RouteMeta[] = (
              results.filter(
                (r): r is FujiResult<RouteMeta> => r.success
              ) as FujiResultSuccess<RouteMeta>[]
            ).map((r) => r.data);
            const selectedRoute = availableRoutes.find(
              (r) => r.address === activeVault.address.value
            );
            // no route means that the active vault has changed before the async call completed
            if (!selectedRoute && formType === FormType.Create) {
              get().updateVault();
              return;
            }
            if (!selectedRoute?.actions.length) {
              throw new FujiError(
                'Route found with empty action array',
                FujiErrorCode.SDK
              );
            }

            set({ availableRoutes });
            get().changeTransactionMeta(selectedRoute);
          } catch (e) {
            set(
              produce((state: BorrowState) => {
                state.transactionMeta.status = FetchStatus.Error;
              })
            );
            const message = e instanceof FujiError ? e.message : String(e);
            console.error(message);
          }
        },

        updateTransactionMetaDebounced: debounce(
          () => get().updateTransactionMeta(),
          TRANSACTION_META_DEBOUNCE_INTERVAL
        ),

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

        /**
         * Allow fuji contract to spend on behalf of the user an amount
         * Currency are deduced from collateral or debt
         * @param type
         */
        async allow(type) {
          const asset = get().assetForType(type);
          if (!asset) return;
          const { currency, input } = asset;
          const amount = parseFloat(input);
          const userAddress = useAuth.getState().address;
          const provider = useAuth.getState().provider;
          const spender = CONNEXT_ROUTER_ADDRESS[currency.chainId].value;

          if (!provider || !userAddress) {
            return;
          }
          get().changeAllowance(type, AllowanceStatus.Approving);
          const owner = provider.getSigner();
          try {
            const approval = await contracts.ERC20__factory.connect(
              currency.address.value,
              owner
            ).approve(
              spender,
              parseUnits(amount.toString(), currency.decimals)
            );
            await approval.wait();

            get().changeAllowance(type, AllowanceStatus.Ready, amount);
            notify({
              message: NOTIFICATION_MESSAGES.ALLOWANCE_SUCCESS,
              type: 'success',
              link: getTransactionLink({
                hash: approval.hash,
                chainId: currency.chainId,
              }),
            });
          } catch (e) {
            get().changeAllowance(type, AllowanceStatus.Error);
            handleTransactionError(
              e,
              NOTIFICATION_MESSAGES.TX_CANCELLED,
              NOTIFICATION_MESSAGES.ALLOWANCE_FAILURE
            );
          }
        },

        async sign() {
          const actions = get().actions;
          const vault = get().activeVault;
          const provider = useAuth.getState().provider;
          let notificationId: NotificationId | undefined;
          try {
            if (!actions || !vault || !provider) {
              throw 'Unexpected undefined value';
            }

            const permitAction = Sdk.findPermitAction(actions);
            if (!permitAction) {
              throw 'No permit action found';
            }

            set({ isSigning: true });

            notificationId = notify({
              type: 'info',
              message: NOTIFICATION_MESSAGES.SIGNATURE_PENDING,
              sticky: true,
            });
            const { domain, types, value } = await vault.signPermitFor(
              permitAction
            );
            const signer = provider.getSigner();
            const s = await signer._signTypedData(domain, types, value);
            const signature = ethers.utils.splitSignature(s);

            set({ signature });
          } catch (e) {
            handleTransactionError(
              e,
              NOTIFICATION_MESSAGES.SIGNATURE_CANCELLED
            );
          } finally {
            if (notificationId) {
              dismiss(notificationId);
            }
            set({ isSigning: false });
          }
        },

        async execute() {
          const { address, provider } = useAuth.getState();
          const { actions, signature, transactionMeta, needsSignature } = get();
          if (
            !actions ||
            !address ||
            !provider ||
            (needsSignature && !signature)
          ) {
            return;
          }
          const notificationId = notify({
            type: 'info',
            message: NOTIFICATION_MESSAGES.TX_PENDING,
            sticky: true,
          });

          const srcChainId = transactionMeta.steps[0].chainId;

          set({ isExecuting: true });

          const result = sdk.getTxDetails(
            actions,
            srcChainId,
            Address.from(address),
            signature
          );
          if (!result.success) {
            dismiss(notificationId);
            notify({ type: 'error', message: result.error.message });
            return;
          }
          const txRequest = result.data;

          try {
            const signer = provider.getSigner();
            const estimated = await signer.estimateGas(txRequest);
            // increase by 20% to prevent outOfGas tx failing
            const gasLimit = estimated.add(estimated.div(BigNumber.from('2')));

            const tx = await signer.sendTransaction({ ...txRequest, gasLimit });

            if (tx) {
              notify({
                type: 'success',
                message: NOTIFICATION_MESSAGES.TX_SENT,
                duration: NotificationDuration.LONG,
                link: getTransactionLink({
                  hash: tx.hash,
                  chainId: srcChainId,
                }),
              });
            }
            return tx;
          } catch (e) {
            handleTransactionError(
              e,
              NOTIFICATION_MESSAGES.TX_CANCELLED,
              NOTIFICATION_MESSAGES.TX_NOT_SENT
            );
          } finally {
            dismiss(notificationId);
            set({ isExecuting: false });
          }
        },

        async signAndExecute() {
          if (get().needsSignature) {
            await get().sign();
          }

          const tx = await get().execute();

          // error was already displayed in execute()
          if (tx) {
            const vaultAddr = get().activeVault?.address.value as string;
            useHistory
              .getState()
              .add(tx.hash, tx.from, vaultAddr, get().transactionMeta.steps);

            get().changeInputValues('', '');
          }
        },

        changeChainOverride(allowChainOverride) {
          set({ allowChainOverride });
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
