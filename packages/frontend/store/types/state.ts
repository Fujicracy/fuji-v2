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
  FetchStatus,
  Mode,
} from '../../helpers/assets';
import { RouteMeta } from '../../helpers/routes';
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
  assetForType: (assetType: AssetType) => AssetChange | undefined;
  changeActiveVault: (v: VaultWithFinancials) => void;
  changeAllowance: (
    assetType: AssetType,
    status: AllowanceStatus,
    amount?: number
  ) => void;
  changeAssetChain: (
    assetType: AssetType,
    chainId: ChainId,
    updateVault: boolean,
    currency?: Currency
  ) => void;
  changeAssetCurrency: (
    assetType: AssetType,
    currency: Currency,
    updateVault: boolean
  ) => void;
  changeAssetValue: (assetType: AssetType, value: string) => void;
  changeBalances: (
    assetType: AssetType,
    balances: Record<string, number>
  ) => void;
  changeFormType: (assetType: FormType) => void;
  changeMode: (mode: Mode) => void;
  changeTransactionMeta: (route: RouteMeta) => void;
  clearInputValues: () => void;

  updateAll: (vaultAddress?: string) => void;
  updateAllowance: (assetType: AssetType) => void;
  updateBalances: (assetType: AssetType) => void;
  updateCurrencyPrice: (assetType: AssetType) => void;
  updateMeta: (
    assetType: AssetType,
    updateVault: boolean,
    updateBalance: boolean
  ) => void;
  updateTransactionMeta: () => void;
  updateTransactionMetaDebounced: () => void;
  updateVault: (address?: string) => void;

  allow: (assetType: AssetType) => void;
  sign: () => void;
  execute: () => Promise<ethers.providers.TransactionResponse | undefined>;
  signAndExecute: () => void;
};
