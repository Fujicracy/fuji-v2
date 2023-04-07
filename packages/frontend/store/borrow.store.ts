import {
  Address,
  BorrowingVault,
  ChainId,
  CONNEXT_ROUTER_ADDRESS,
  contracts,
  DEFAULT_SLIPPAGE,
  FujiError,
  FujiErrorCode,
  FujiResultError,
  FujiResultSuccess,
  LendingProviderDetails,
  RouterActionParams,
  RoutingStepDetails,
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

import { DEFAULT_LTV_MAX, DEFAULT_LTV_THRESHOLD } from '../constants';
import {
  AllowanceStatus,
  AssetChange,
  AssetType,
  LiquidationMeta,
  LtvMeta,
  Mode,
} from '../helpers/assets';
import { fetchBalances } from '../helpers/balances';
import { failureForMode } from '../helpers/borrow';
import { testChains } from '../helpers/chains';
import { getTransactionUrl, notify } from '../helpers/notifications';
import { fetchRoutes, RouteMeta } from '../helpers/routing';
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

  transactionMeta: {
    status: FetchStatus;
    gasFees: number; // TODO: cannot estimate gas fees until the user has approved AND permit fuji to use its fund
    bridgeFee: number;
    estimateTime: number;
    estimateSlippage: number;
    steps: RoutingStepDetails[];
  };
  availableRoutes: RouteMeta[];

  needsSignature: boolean;
  isSigning: boolean;
  signature?: Signature;
  actions?: RouterActionParams[];

  isExecuting: boolean;
};
export type FetchStatus = 'initial' | 'fetching' | 'ready' | 'error';

type BorrowActions = {
  changeFormType: (type: FormType) => void;
  changeMode: (mode: Mode) => void;
  changeAll: (collateral: Token, debt: Token, vault: BorrowingVault) => void;
  changeInputValues: (collateral: string, debt: string) => void;
  changeAssetChain: (
    type: AssetType,
    chainId: ChainId,
    updateVault: boolean
  ) => void;
  changeAssetToken: (type: AssetType, token: Token) => void;
  changeAssetValue: (type: AssetType, value: string) => void;
  changeDebtChain: (chainId: ChainId, updateVault: boolean) => void; // Convenience
  changeDebtToken: (token: Token) => void; // Convenience
  changeDebtValue: (val: string) => void; // Convenience
  changeCollateralChain: (chainId: ChainId, updateVault: boolean) => void; // Convenience
  changeCollateralToken: (token: Token) => void; // Convenience
  changeCollateralValue: (val: string) => void; // Convenience
  changeActiveVault: (v: BorrowingVault) => void;
  changeTransactionMeta: (route: RouteMeta) => void;
  changeSlippageValue: (slippage: number) => void;
  changeBalances: (type: AssetType, balances: Record<string, number>) => void;

  updateAllProviders: () => void;
  updateTokenPrice: (type: AssetType) => void;
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
  signPermit: () => void;
  execute: () => Promise<ethers.providers.TransactionResponse | undefined>;
  signAndExecute: () => void;
};

const initialChainId = ChainId.MATIC;
const initialDebtTokens = sdk.getDebtForChain(initialChainId);
const initialCollateralTokens = sdk.getCollateralForChain(initialChainId);

const initialState: BorrowState = {
  formType: 'create',
  mode: Mode.DEPOSIT_AND_BORROW,

  availableVaults: [],
  availableVaultsStatus: 'initial',
  allProviders: {},

  activeVault: undefined,
  activeProvider: undefined,

  collateral: {
    selectableTokens: initialCollateralTokens,
    balances: {},
    input: '',
    chainId: initialChainId,
    allowance: {
      status: 'initial',
      value: undefined,
    },
    token: initialCollateralTokens[0],
    amount: 0,
    usdPrice: 0,
  },

  debt: {
    selectableTokens: initialDebtTokens,
    balances: {},
    allowance: { status: 'initial', value: undefined },
    input: '',
    chainId: initialChainId,
    token: initialDebtTokens[0],
    amount: 0,
    usdPrice: 0,
  },

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
    bridgeFee: 0,
    gasFees: 0,
    estimateTime: 0,
    estimateSlippage: 0,
    steps: [],
  },
  availableRoutes: [],

  needsSignature: true,
  isSigning: false,
  isExecuting: false,
};

export const useBorrow = create<BorrowStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

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
              state.collateral.selectableTokens = collaterals;
              state.collateral.token = collateral;

              state.debt.chainId = debt.chainId;
              state.debt.selectableTokens = debts;
              state.debt.token = debt;
            })
          );
          get().updateTokenPrice('collateral');
          get().updateBalances('collateral');
          get().updateTokenPrice('debt');
          get().updateBalances('debt');
          get().updateAllowance('collateral');
          get().updateAllowance('debt');

          await get().changeActiveVault(vault);

          const availableVaults = await sdk.getBorrowingVaultsFor(
            collateral,
            debt
          );
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
          const tokens =
            type === 'debt'
              ? sdk.getDebtForChain(chainId)
              : sdk.getCollateralForChain(chainId);

          set(
            produce((state: BorrowState) => {
              const t = type === 'debt' ? state.debt : state.collateral;
              t.chainId = chainId;
              t.selectableTokens = tokens;
              t.token = tokens[0];
            })
          );
          get().updateTokenPrice(type);
          get().updateBalances(type);

          if (updateVault) {
            get().updateVault();
          } else {
            get().updateTransactionMeta();
          }

          get().updateAllowance(type);
        },

        changeAssetToken(type, token) {
          set(
            produce((state: BorrowState) => {
              if (type === 'debt') {
                state.debt.token = token;
              } else {
                state.collateral.token = token;
              }
            })
          );
          get().updateTokenPrice(type);
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

        changeCollateralToken(token) {
          get().changeAssetToken('collateral', token);
        },

        changeCollateralValue(value) {
          get().changeAssetValue('collateral', value);
        },

        changeDebtChain(chainId: ChainId, updateVault) {
          get().changeAssetChain('debt', chainId, updateVault);
        },

        changeDebtToken(token) {
          get().changeAssetToken('debt', token);
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
              state.transactionMeta.bridgeFee = route.bridgeFee;
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

          const tokens = (type === 'debt' ? get().debt : get().collateral)
            .selectableTokens;
          const token =
            type === 'debt' ? get().debt.token : get().collateral.token;
          const chainId = token.chainId;
          const result = await fetchBalances(tokens, address, chainId);
          if (!result.success) {
            console.error(result.error.message);
            return;
          }
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

        async updateTokenPrice(type) {
          const token =
            type === 'debt' ? get().debt.token : get().collateral.token;

          let tokenValue = await token.getPriceUSD();
          const isTestNet = testChains.some((c) => c.chainId === token.chainId);
          if (token.symbol === 'WETH' && isTestNet) {
            tokenValue = 1242.42; // fix bc weth has no value on testnet
          }

          set(
            produce((state: BorrowState) => {
              if (type === 'debt') {
                state.debt.usdPrice = tokenValue;
              } else {
                state.collateral.usdPrice = tokenValue;
              }
            })
          );
          get().updateLtv();
          get().updateLiquidation();
        },

        async updateAllowance(type) {
          const token =
            type === 'debt' ? get().debt.token : get().collateral.token;
          const address = useAuth.getState().address;

          if (!address) {
            return;
          }

          set(
            produce((s: BorrowState) => {
              if (type === 'debt') {
                s.debt.allowance.status = 'fetching';
              } else {
                s.collateral.allowance.status = 'fetching';
              }
            })
          );
          try {
            const res = await sdk.getAllowanceFor(token, Address.from(address));
            const value = parseFloat(formatUnits(res, token.decimals));
            set(
              produce((s: BorrowState) => {
                if (type === 'debt') {
                  s.debt.allowance.status = 'ready';
                  s.debt.allowance.value = value;
                } else {
                  s.collateral.allowance.status = 'ready';
                  s.collateral.allowance.value = value;
                }
              })
            );
          } catch (e) {
            // TODO: how to handle the case where we can't fetch allowance ?
            console.error(e);
            set(
              produce((s: BorrowState) => {
                if (type === 'debt') {
                  s.debt.allowance.status = 'error';
                } else {
                  s.collateral.allowance.status = 'error';
                }
              })
            );
          }
        },

        async updateVault() {
          set({ availableVaultsStatus: 'fetching' });

          const collateral = get().collateral.token;
          const debt = get().debt.token;
          const availableVaults = await sdk.getBorrowingVaultsFor(
            collateral,
            debt
          );
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

          const { activeVault, collateral, debt, mode, slippage } = get();
          if (
            !activeVault ||
            failureForMode(mode, collateral.input, debt.input)
          ) {
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
              formType === 'create'
                ? get().availableVaults
                : [get().activeVault as BorrowingVault];
            const results = await Promise.all(
              vaults.map((v, i) => {
                const recommended = i === 0;

                return fetchRoutes(
                  mode,
                  v,
                  collateral.token,
                  debt.token,
                  collateral.input,
                  debt.input,
                  address,
                  recommended,
                  slippage
                );
              })
            );
            const error = results.find((r): r is FujiResultError => !r.success);
            if (error) {
              throw error.error;
            }
            const availableRoutes: RouteMeta[] = (
              results as FujiResultSuccess<RouteMeta>[]
            ).map((r) => r.data);
            const selectedRoute = availableRoutes.find(
              (r) => r.address === activeVault.address.value
            );
            if (!selectedRoute || !selectedRoute.actions.length) {
              throw new FujiError(
                'No route found for active vault or route found with empty action array',
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
            notify({ type: 'error', message });
          }
        },

        updateTransactionMetaDebounced: debounce(
          () => get().updateTransactionMeta(),
          500
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

          const liquidationTreshold = get().ltv.ltvThreshold;

          const liquidationPrice =
            debtValue / (collateralAmount * (liquidationTreshold / 100));
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
          set(
            produce((s: BorrowState) => {
              const dec = s.collateral.token.decimals;
              s.collateral.amount = parseFloat(formatUnits(deposit, dec));

              const dec2 = s.debt.token.decimals;
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
          const { token, input } =
            type === 'debt' ? get().debt : get().collateral;
          const amount = parseFloat(input);
          const userAddress = useAuth.getState().address;
          const provider = useAuth.getState().provider;
          const spender = CONNEXT_ROUTER_ADDRESS[token.chainId].value;

          if (!provider || !userAddress) {
            return;
          }

          const changeAllowance = (
            status: AllowanceStatus,
            amount?: number
          ) => {
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
          };
          changeAllowance('allowing');
          const owner = provider.getSigner();
          try {
            const approval = await contracts.ERC20__factory.connect(
              token.address.value,
              owner
            ).approve(spender, parseUnits(amount.toString(), token.decimals));
            await approval.wait();

            changeAllowance('ready', amount);
            notify({
              message: 'Allowance is successful',
              type: 'success',
              isTransaction: true,
              link:
                getTransactionUrl({
                  hash: approval.hash,
                  chainId: token.chainId,
                }) || '',
            });
          } catch (e) {
            changeAllowance('error');
            notify({ message: 'Allowance was not successful', type: 'error' });
          }
        },

        async signPermit() {
          const actions = get().actions;
          const vault = get().activeVault;
          const provider = useAuth.getState().provider;

          try {
            if (!actions || !vault || !provider) {
              throw 'Unexpected undefined value';
            }

            const permitAction = Sdk.findPermitAction(actions);
            if (!permitAction) {
              throw 'No permit action found';
            }

            set({ isSigning: true });

            const { domain, types, value } = await vault.signPermitFor(
              permitAction
            );
            const signer = provider.getSigner();
            const s = await signer._signTypedData(domain, types, value);
            const signature = ethers.utils.splitSignature(s);

            set({ signature });
          } catch (e) {
            const message =
              e instanceof Error
                ? e.message === 'user rejected signing' // Thrown by ethers.js
                  ? 'Signature was canceled by the user.'
                  : e.message
                : String(e);
            notify({
              type: 'error',
              message,
            });
          } finally {
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
            throw 'Unexpected undefined param';
          }

          const srcChainId = transactionMeta.steps[0].chainId;

          set({ isExecuting: true });

          const result = sdk.getTxDetails(
            actions,
            srcChainId,
            Address.from(address),
            signature
          );
          if (!result.success) {
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
                message: 'The transaction was submitted successfully.',
              });
            }
            return tx;
          } catch (e) {
            notify({
              type: 'error',
              message:
                'The transaction was canceled by the user or cannot be submitted.',
            });
          } finally {
            set({ isExecuting: false });
          }
        },

        async signAndExecute() {
          if (get().needsSignature) {
            await get().signPermit();
          }

          const tx = await get().execute();

          // error was already displayed in execute()
          if (tx) {
            const vaultAddr = get().activeVault?.address.value as string;
            useHistory
              .getState()
              .add(tx.hash, vaultAddr, get().transactionMeta.steps);

            get().changeInputValues('', '');
          }
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
