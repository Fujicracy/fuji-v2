import {
  AbstractVault,
  ChainId,
  Currency,
  LendingProviderWithFinancials,
  RouterActionParams,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { ethers, Signature } from 'ethers';
import { setAutoFreeze } from 'immer';

import {
  AllowanceStatus,
  AssetChange,
  AssetType,
  defaultAssetForType,
  FetchStatus,
  Mode,
} from '../../helpers/assets';
import { RouteMeta } from '../../helpers/routing';
import { TransactionMeta } from '../../helpers/transactions';

setAutoFreeze(false);

export enum FormType {
  Create,
  Edit,
}

export type SharedState = {
  formType: FormType;
  mode: Mode;

  availableVaults: VaultWithFinancials[];
  availableVaultsStatus: FetchStatus;

  activeVault?: AbstractVault;
  activeProvider?: LendingProviderWithFinancials;
  allProviders: LendingProviderWithFinancials[] | [];

  collateral: AssetChange;

  transactionMeta: TransactionMeta;
  availableRoutes: RouteMeta[];

  needsSignature: boolean;
  isSigning: boolean;
  signature?: Signature;
  actions?: RouterActionParams[];

  isExecuting: boolean;
};

export const initialSharedState: SharedState = {
  formType: FormType.Create,
  mode: Mode.DEPOSIT,

  availableVaults: [],
  availableVaultsStatus: FetchStatus.Initial,
  allProviders: [],

  activeVault: undefined,
  activeProvider: undefined,

  collateral: defaultAssetForType(AssetType.Collateral),

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
};

export type SharedActions = {
  assetForType: (type: AssetType) => AssetChange | undefined;
  changeActiveVault: (v: VaultWithFinancials) => void;
  changeAllowance: (
    type: AssetType,
    status: AllowanceStatus,
    amount?: number
  ) => void;
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
  changeBalances: (type: AssetType, balances: Record<string, number>) => void;
  changeFormType: (type: FormType) => void;
  changeMode: (mode: Mode) => void;
  changeTransactionMeta: (route: RouteMeta) => void;
  clearInputValues: () => void;

  updateAll: (vaultAddress?: string) => void;
  updateAllowance: (type: AssetType) => void;
  updateBalances: (type: AssetType) => void;
  updateCurrencyPrice: (type: AssetType) => void;
  updateMeta: (
    type: AssetType,
    updateVault: boolean,
    updateBalance: boolean
  ) => void;
  updateTransactionMeta: () => void;
  updateTransactionMetaDebounced: () => void;
  updateVault: (address?: string) => void;

  allow: (type: AssetType) => void;
  sign: () => void;
  execute: () => Promise<ethers.providers.TransactionResponse | undefined>;
  signAndExecute: () => void;
};
