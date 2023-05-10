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
  LendingProviderDetails,
  RouterActionParams,
  Sdk,
  Token,
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
  AssetType,
  defaultAssetForType,
  defaultCurrency,
  LiquidationMeta,
  LtvMeta,
  Mode,
} from '../helpers/assets';
import { fetchBalances } from '../helpers/balances';
import { isSupported, testChains } from '../helpers/chains';
import { handleCancelableMMActionError } from '../helpers/errors';
import {
  dismiss,
  getTransactionLink,
  NotificationDuration,
  NotificationId,
  notify,
} from '../helpers/notifications';
import { fetchRoutes, RouteMeta } from '../helpers/routing';
import { TransactionMeta } from '../helpers/transactions';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import { useHistory } from './history.store';

setAutoFreeze(false);

type FormType = 'create' | 'edit';

export type BorrowStore = BorrowState & BorrowActions;
type BorrowState = {
  formType: FormType;
  mode: Mode;

  availableVaults: BorrowingVault[];
  availableVaultsStatus: FetchStatus;
  // Providers are mapped with their vault address
  allProviders: Record<string, LendingProviderDetails[]>;

  activeVault: BorrowingVault | undefined;
  activeProvider: LendingProviderDetails | undefined;

  collateral: AssetChange;
  debt: AssetChange;

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
export type FetchStatus = 'initial' | 'fetching' | 'ready' | 'error';

type BorrowActions = {
  assetForType: (type: AssetType) => AssetChange;
  changeFormType: (type: FormType) => void;
  changeMode: (mode: Mode) => void;
  changeAll: (
    collateral: Currency,
    debt: Currency,
    vault: BorrowingVault
  ) => void;
  changeInputValues: (collateral: string, debt: string) => void;
  changeAssetChain: (
    type: AssetType,
    chainId: ChainId,
    updateVault: boolean
  ) => void;
  changeAssetCurrency: (type: AssetType, currency: Currency) => void;
  changeAssetValue: (type: AssetType, value: string) => void;
  changeDebtChain: (chainId: ChainId, updateVault: boolean) => void; // Convenience
  changeDebtCurrency: (currency: Currency) => void; // Convenience
  changeDebtValue: (val: string) => void; // Convenience
  changeCollateralChain: (chainId: ChainId, updateVault: boolean) => void; // Convenience
  changeCollateralCurrency: (currency: Currency) => void; // Convenience
  changeCollateralValue: (val: string) => void; // Convenience
  changeActiveVault: (v: BorrowingVault) => void;
  changeTransactionMeta: (route: RouteMeta) => void;
  changeSlippageValue: (slippage: number) => void;
  changeBalances: (type: AssetType, balances: Record<string, number>) => void;
  changeAllowance: (
    type: AssetType,
    status: AllowanceStatus,
    amount?: number
  ) => void;

  updateAllProviders: () => void;
  updateCurrencyPrice: (type: AssetType) => void;
  updateBalances: (type: AssetType) => void;
  updateAllowance: (type: AssetType) => void;
  updateVault: () => void;
  updateTransactionMeta: () => void;
  updateTransactionMetaDebounced: () => void;
  updateLtv: () => void;
  updateLiquidation: () => void;
  updateVaultBalance: () => void;
  allow: (type: AssetType) => void;
  updateAvailableRoutes: (routes: RouteMeta[]) => void;
  sign: () => void;
  execute: () => Promise<ethers.providers.TransactionResponse | undefined>;
  signAndExecute: () => void;

  changeChainOverride: (allow: boolean) => void;
};

const initialState: BorrowState = {
  formType: 'create',
  mode: Mode.DEPOSIT_AND_BORROW,

  availableVaults: [],
  availableVaultsStatus: 'initial',
  allProviders: {},

  activeVault: undefined,
  activeProvider: undefined,

  collateral: defaultAssetForType('collateral'),
  debt: defaultAssetForType('debt'),

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
    status: 'initial',
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
          return type === 'collateral' ? get().collateral : get().debt;
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
              state.activeVault = vault; // Need to test this

              state.collateral.chainId = collateral.chainId;
              state.collateral.selectableCurrencies = collaterals;
              state.collateral.currency = collateral;

              state.debt.chainId = debt.chainId;
              state.debt.selectableCurrencies = debts;
              state.debt.currency = debt;
            })
          );
          get().updateCurrencyPrice('collateral');
          get().updateBalances('collateral');
          get().updateCurrencyPrice('debt');
          get().updateBalances('debt');
          get().updateAllowance('collateral');
          get().updateAllowance('debt');

          await get().changeActiveVault(vault);

          const result = await sdk.getBorrowingVaultsFor(collateral, debt);

          if (!result.success) {
            console.error(result.error.message);
            set({ availableVaultsStatus: 'error' });
            return;
          }
          const availableVaults = result.data;
          set({ availableVaults });

          await Promise.all([
            get().updateAllProviders(),
            get().updateTransactionMeta(),
          ]);
          set({ availableVaultsStatus: 'ready' });
        },

        async changeInputValues(collateral, debt) {
          await Promise.all([
            get().changeCollateralValue(collateral),
            get().changeDebtValue(debt),
          ]);
        },

        changeAssetChain(type, chainId: ChainId, updateVault) {
          if (!isSupported(chainId)) return;

          const currencies =
            type === 'debt'
              ? sdk.getDebtForChain(chainId)
              : sdk.getCollateralForChain(chainId);

          set(
            produce((state: BorrowState) => {
              const t = type === 'debt' ? state.debt : state.collateral;
              t.chainId = chainId;
              t.selectableCurrencies = currencies;
              t.currency = defaultCurrency(currencies);
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

        changeAssetCurrency(type, currency) {
          set(
            produce((state: BorrowState) => {
              if (type === 'debt') {
                state.debt.currency = currency;
              } else {
                state.collateral.currency = currency;
              }
            })
          );
          get().updateCurrencyPrice(type);
          get().updateVault();
          get().updateAllowance(type);
        },

        changeAssetValue(type, value) {
          set(
            produce((state: BorrowState) => {
              if (type === 'debt') {
                state.debt.input = value;
              } else {
                state.collateral.input = value;
              }
            })
          );
          get().updateTransactionMetaDebounced();
          get().updateLtv();
          get().updateLiquidation();
        },

        changeCollateralChain(chainId: ChainId, updateVault) {
          get().changeAssetChain('collateral', chainId, updateVault);
        },

        changeCollateralCurrency(currency) {
          get().changeAssetCurrency('collateral', currency);
        },

        changeCollateralValue(value) {
          get().changeAssetValue('collateral', value);
        },

        changeDebtChain(chainId: ChainId, updateVault) {
          get().changeAssetChain('debt', chainId, updateVault);
        },

        changeDebtCurrency(currency) {
          get().changeAssetCurrency('debt', currency);
        },

        changeDebtValue(value) {
          get().changeAssetValue('debt', value);
        },

        changeSlippageValue(slippage) {
          set({ slippage });
        },

        async changeActiveVault(vault) {
          const providers = await vault.getProviders();

          const ltvMax = vault.maxLtv
            ? parseInt(ethers.utils.formatUnits(vault.maxLtv, 16))
            : DEFAULT_LTV_MAX;
          const ltvThreshold = vault.liqRatio
            ? parseInt(ethers.utils.formatUnits(vault.liqRatio, 16))
            : DEFAULT_LTV_THRESHOLD;

          set(
            produce((s: BorrowState) => {
              s.activeVault = vault;
              s.activeProvider = providers.find((p) => p.active);
              s.ltv.ltvMax = ltvMax;
              s.ltv.ltvThreshold = ltvThreshold;
            })
          );
          const route = get().availableRoutes.find(
            (r) => r.address === vault.address.value
          );
          if (route) {
            get().changeTransactionMeta(route);
          }
          await get().updateVaultBalance();
        },

        async changeTransactionMeta(route) {
          set(
            produce((state: BorrowState) => {
              state.transactionMeta.status = 'ready';
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
          if (!address) {
            return;
          }

          const asset = get().assetForType(type);
          const currencies = asset.selectableCurrencies;
          const currency = asset.currency;
          const chainId = currency.chainId;
          const result = await fetchBalances(currencies, address, chainId);
          if (!result.success) {
            console.error(result.error.message);
            return;
          }
          const currentCurrency = get().assetForType(type).currency;
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
              if (type === 'debt') {
                state.debt.balances = balances;
              } else if (type === 'collateral') {
                state.collateral.balances = balances;
              }
            })
          );
        },

        async changeAllowance(type, status, amount) {
          set(
            produce((s: BorrowState) => {
              if (type === 'debt') {
                s.debt.allowance.status = status;
                if (amount) s.debt.allowance.value = amount;
              } else {
                s.collateral.allowance.status = status;
                if (amount) s.collateral.allowance.value = amount;
              }
            })
          );
        },

        async updateCurrencyPrice(type) {
          const currency = get().assetForType(type).currency;

          const result = await currency.getPriceUSD();
          if (!result.success) {
            console.error(result.error.message);
            return;
          }

          const currentCurrency = get().assetForType(type).currency;
          if (currency.address !== currentCurrency.address) return;

          let currencyValue = result.data;
          const isTestNet = testChains.some(
            (c) => c.chainId === currency.chainId
          );
          if (currency.symbol === 'WETH' && isTestNet) {
            currencyValue = 1242.42; // fix bc weth has no value on testnet
          }

          set(
            produce((state: BorrowState) => {
              if (type === 'debt') {
                state.debt.usdPrice = currencyValue;
              } else {
                state.collateral.usdPrice = currencyValue;
              }
            })
          );
          get().updateLtv();
          get().updateLiquidation();
        },

        async updateAllowance(type) {
          const currency = get().assetForType(type).currency;
          const address = useAuth.getState().address;

          if (!address) {
            return;
          }
          if (currency.isNative) {
            get().changeAllowance(type, 'unneeded');
            return;
          }
          get().changeAllowance(type, 'fetching');
          try {
            if (!(currency instanceof Token)) {
              return;
            }
            const res = await sdk.getAllowanceFor(
              currency,
              Address.from(address)
            );

            const currentCurrency = get().assetForType(type).currency;
            if (
              currency.address !== currentCurrency.address ||
              currency.chainId !== currentCurrency.chainId
            )
              return;

            const value = parseFloat(formatUnits(res, currency.decimals));
            get().changeAllowance(type, 'ready', value);
          } catch (e) {
            // TODO: how to handle the case where we can't fetch allowance ?
            console.error(e);
            get().changeAllowance(type, 'error');
          }
        },

        async updateVault() {
          set({ availableVaultsStatus: 'fetching' });

          const collateral = get().collateral.currency;
          const debt = get().debt.currency;
          const result = await sdk.getBorrowingVaultsFor(collateral, debt);

          if (!result.success) {
            console.error(result.error.message);
            set({ availableVaultsStatus: 'error' });
            return;
          }

          const availableVaults = result.data;
          const [vault] = availableVaults;
          if (!vault) {
            console.error('No available vault');
            set({ availableVaultsStatus: 'error' });
            return;
          }
          set({ availableVaults });

          await get().changeActiveVault(vault);
          await Promise.all([
            get().updateAllProviders(),
            get().updateTransactionMeta(),
          ]);
          set({ availableVaultsStatus: 'ready' });
        },

        async updateAllProviders() {
          const { availableVaults } = get();

          const allProviders: Record<string, LendingProviderDetails[]> = {};
          for (const v of availableVaults) {
            const providers = await v.getProviders();
            allProviders[v.address.value] = providers;
          }

          set({ allProviders });
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
          const collateralInput =
            collateral.input === '' ? '0' : collateral.input;
          const debtInput = debt.input === '' ? '0' : debt.input;
          if (!activeVault) {
            return set(
              produce((state: BorrowState) => {
                state.transactionMeta.status = 'error';
              })
            );
          }

          set(
            produce((state: BorrowState) => {
              state.transactionMeta.status = 'fetching';
              state.signature = undefined;
              state.actions = undefined;
            })
          );

          try {
            const formType = get().formType;
            // when editing a position, we need to fetch routes only for the active vault
            const vaults =
              formType === 'create' && availableVaults.length > 0
                ? availableVaults
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
            if (!selectedRoute && formType === 'create') {
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
                state.transactionMeta.status = 'error';
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
          const collateralAmount = parseFloat(get().collateral.input);
          const collateralPrice = get().collateral.usdPrice;
          const collateralValue = collateralAmount * collateralPrice;

          const debtAmount = parseFloat(get().debt.input);
          const debtPrice = get().debt.usdPrice;
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
          const collateralAmount = parseFloat(get().collateral.input);
          const collateralPrice = get().collateral.usdPrice;

          const debtAmount = parseFloat(get().debt.input);
          const debtPrice = get().debt.usdPrice;
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

        async updateVaultBalance() {
          const vault = get().activeVault;
          const address = useAuth.getState().address;
          if (!vault || !address) {
            return;
          }

          const { deposit, borrow } = await vault.getBalances(
            Address.from(address)
          );

          const currentVault = get().activeVault;
          if (vault.address.value !== currentVault?.address.value) return;

          set(
            produce((s: BorrowState) => {
              const dec = s.collateral.currency.decimals;
              s.collateral.amount = parseFloat(formatUnits(deposit, dec));

              const dec2 = s.debt.currency.decimals;
              s.debt.amount = parseFloat(formatUnits(borrow, dec2));
            })
          );
        },

        /**
         * Allow fuji contract to spend on behalf of the user an amount
         * Token are deduced from collateral or debt
         * @param type
         */
        async allow(type) {
          const { currency, input } = get().assetForType(type);
          const amount = parseFloat(input);
          const userAddress = useAuth.getState().address;
          const provider = useAuth.getState().provider;
          const spender = CONNEXT_ROUTER_ADDRESS[currency.chainId].value;

          if (!provider || !userAddress) {
            return;
          }
          get().changeAllowance(type, 'allowing');
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

            get().changeAllowance(type, 'ready', amount);
            notify({
              message: NOTIFICATION_MESSAGES.ALLOWANCE_SUCCESS,
              type: 'success',
              link: getTransactionLink({
                hash: approval.hash,
                chainId: currency.chainId,
              }),
            });
          } catch (e) {
            get().changeAllowance(type, 'error');
            notify({
              message: NOTIFICATION_MESSAGES.ALLOWANCE_FAILURE,
              type: 'error',
            });
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
            handleCancelableMMActionError(
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
            handleCancelableMMActionError(
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
      {
        enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
        name: 'xFuji/borrow',
      }
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
