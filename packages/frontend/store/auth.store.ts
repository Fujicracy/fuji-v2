import { ConnectOptions } from '@web3-onboard/core';
import {
  Balances,
  ConnectedChain,
  WalletState,
} from '@web3-onboard/core/dist/types';
import { ChainId } from '@x-fuji/sdk';
import { ethers, utils } from 'ethers';
import { create, StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';

import { web3onboard } from '../helpers/auth';
import { chainIdToHex } from '../helpers/chains';

export const onboard = web3onboard;

type OnboardStatus = {
  hasAcceptedTerms: boolean;
  date?: Date | string;
  isExploreInfoSkipped?: boolean;
};

type ConnectedState = {
  status: 'connected';
  address: string;
  ens: string | undefined;
  balance: Balances;
  chain: ConnectedChain;
  provider: ethers.providers.Web3Provider;
  walletName: string;
};
type InitialState = {
  status: 'initial';
  address: undefined;
  ens: undefined;
  balance: undefined;
  chain: undefined;
  provider: undefined;
  walletName: undefined;
};
type DisconnectedState = {
  status: 'disconnected';
  address: undefined;
  ens: undefined;
  balance: undefined;
  chain: undefined;
  provider: undefined;
  walletName: undefined;
};
type State = InitialState | ConnectedState | DisconnectedState;

type Action = {
  login: (options?: ConnectOptions) => void;
  init: () => void;
  logout: () => void;
  acceptTermsOfUse: () => void;
  getOnboardStatus: () => OnboardStatus;
  dismissBanner: (key: string) => void;
  getBannerVisibility: (key: string) => boolean;
  setExploreInfoSkipped: (value: boolean) => void;
  changeChain: (chainId: ChainId) => void;
};

type AuthStore = State & Action;

const initialState: InitialState = {
  status: 'initial',
  address: undefined,
  ens: undefined,
  balance: undefined,
  chain: undefined,
  provider: undefined,
  walletName: undefined,
};

export const useAuth = create<AuthStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      init: async () => {
        reconnect(set, get);
        onOnboardChange(set, get);
      },

      login: async (options) => {
        const wallets = await onboard.connectWallet(options);

        if (!wallets[0] || !wallets[0].accounts[0]) {
          set({ status: 'disconnected' });
          return;
        }

        const json = JSON.stringify(wallets.map(({ label }) => label));
        localStorage.setItem('connectedWallets', json);

        const balance = wallets[0].accounts[0].balance;
        const address = utils.getAddress(wallets[0].accounts[0].address);
        const chain = wallets[0].chains[0];
        const provider = new ethers.providers.Web3Provider(wallets[0].provider);

        set({ status: 'connected', address, balance, chain, provider });
      },

      logout: async () => {
        const wallets = onboard.state.get().wallets;
        for (const { label } of wallets) {
          await onboard.disconnectWallet({ label });
        }

        localStorage.removeItem('connectedWallets');

        set({ ...initialState, status: 'disconnected' });
      },

      acceptTermsOfUse: () => {
        const onboardStatus: OnboardStatus = {
          hasAcceptedTerms: true,
          date: new Date().toJSON(),
        };
        const json = JSON.stringify(onboardStatus);
        localStorage.setItem('termsAccepted', json);
      },

      getOnboardStatus: (): OnboardStatus => {
        const onboardStatusJson = localStorage.getItem('termsAccepted');
        if (!onboardStatusJson) return { hasAcceptedTerms: false };

        const onboardStatus: OnboardStatus = JSON.parse(onboardStatusJson);

        return {
          hasAcceptedTerms: onboardStatus.hasAcceptedTerms,
          date: onboardStatus.date && new Date(onboardStatus.date),
          isExploreInfoSkipped: onboardStatus.isExploreInfoSkipped,
        };
      },

      setExploreInfoSkipped: (isExploreInfoSkipped: boolean) => {
        const onboardStatusJson = localStorage.getItem('termsAccepted');
        if (!onboardStatusJson) return;

        const onboardStatus: OnboardStatus = JSON.parse(onboardStatusJson);

        const json = JSON.stringify({ ...onboardStatus, isExploreInfoSkipped });
        localStorage.setItem('termsAccepted', json);
      },

      dismissBanner: (key: string): void => {
        localStorage.setItem(`${key}BannerDismissed`, 'true');
      },

      getBannerVisibility: (key: string): boolean => {
        const statusJson = localStorage.getItem(`${key}BannerDismissed`);
        return !statusJson || statusJson !== 'true';
      },

      changeChain: async (chainId) => {
        const hexChainId = chainIdToHex(chainId);
        await onboard.setChain({ chainId: hexChainId });
      },
    }),
    {
      enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
      name: 'xFuji/auth',
    }
  )
);

async function reconnect(
  set: StoreApi<State & Action>['setState'],
  get: StoreApi<State & Action>['getState']
) {
  const previouslyConnectedWallets = localStorage.getItem('connectedWallets');

  if (!previouslyConnectedWallets) {
    return set({ status: 'disconnected' });
  }
  const wallets = JSON.parse(previouslyConnectedWallets);
  await get().login({
    autoSelect: { label: wallets[0], disableModals: true },
  });
}

function onOnboardChange(
  set: StoreApi<State & Action>['setState'],
  get: StoreApi<State & Action>['getState']
) {
  onboard.state.select('wallets').subscribe((w: WalletState[]) => {
    const updates: Partial<ConnectedState> = {};

    if (!w[0] && get().status === 'disconnected') {
      return;
    } else if (!w[0] || !w[0].accounts[0]) {
      // Triggered when user disconnects from its wallet
      return get().logout();
    }

    const chain = w[0].chains[0];
    if (chain.id !== get().chain?.id) {
      updates.chain = chain;
    }

    const balance = w[0].accounts[0].balance;
    if (balance && balance !== get().balance) {
      updates.balance = balance;
    }

    const address = w[0].accounts[0].address;
    if (address && address !== get().address) {
      updates.address = utils.getAddress(address);
    }

    // TODO: how to !== new provider from old ?
    const provider = new ethers.providers.Web3Provider(w[0].provider);
    if (provider) {
      updates.provider = provider;
    }

    const ens = w[0].accounts[0].ens?.name;
    if (ens !== get().ens) {
      updates.ens = ens;
    }

    const walletName = w[0].label;

    if (walletName) {
      updates.walletName = walletName;
    }

    if (Object.entries(updates).length > 0) {
      set(updates);
    }
  });
}
