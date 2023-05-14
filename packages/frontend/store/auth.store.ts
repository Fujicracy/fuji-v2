import { ConnectOptions } from '@web3-onboard/core';
import { Balances, WalletState } from '@web3-onboard/core/dist/types';
import { ChainId } from '@x-fuji/sdk';
import { ethers, utils } from 'ethers';
import produce from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { web3onboard } from '../helpers/auth';
import { chainIdToHex, hexToChainId } from '../helpers/chains';

export const onboard = web3onboard;

type OnboardStatus = {
  hasAcceptedTerms: boolean;
  date?: Date | string;
  isExploreInfoSkipped?: boolean;
};

export enum AuthStatus {
  Initial,
  Connected,
  Disconnected,
}

type AuthState = {
  status: AuthStatus;
  started: boolean;
  address?: string;
  ens?: string;
  balance?: Balances;
  chainId?: ChainId;
  provider?: ethers.providers.Web3Provider;
  walletName?: string;
};

type AuthActions = {
  login: (options?: ConnectOptions) => void;
  changeWallet: (wallets: WalletState[]) => void;
  updateWallet: (wallets: WalletState[]) => void;
  init: () => void;
  logout: () => void;
  acceptTermsOfUse: () => void;
  getOnboardStatus: () => OnboardStatus;
  dismissBanner: (key: string) => void;
  getBannerVisibility: (key: string) => boolean;
  setExploreInfoSkipped: (value: boolean) => void;
  changeChain: (chainId: ChainId) => void;
};

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  status: AuthStatus.Initial,
  started: false,
};

export const useAuth = create<AuthStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      init: async () => {
        set({ started: true });

        const previouslyConnectedWallets =
          localStorage.getItem('connectedWallets');

        if (!previouslyConnectedWallets) {
          set({ status: AuthStatus.Disconnected });
          return;
        }
        const wallets = JSON.parse(previouslyConnectedWallets);
        get().login({
          autoSelect: { label: wallets[0], disableModals: true },
        });
      },

      changeWallet(wallets) {
        const balance = wallets[0].accounts[0].balance;
        const ens = wallets[0].accounts[0].ens?.name;
        const address = utils.getAddress(wallets[0].accounts[0].address);
        const chainId = hexToChainId(wallets[0].chains[0]?.id);
        const provider = new ethers.providers.Web3Provider(wallets[0].provider);

        set({
          status: AuthStatus.Connected,
          address,
          balance,
          chainId,
          ens,
          provider,
        });

        const json = JSON.stringify(wallets.map(({ label }) => label));
        localStorage.setItem('connectedWallets', json);
      },

      updateWallet(wallets) {
        set(
          produce((state) => {
            if (
              !wallets[0] ||
              !wallets[0].accounts[0] ||
              get().status === AuthStatus.Disconnected
            ) {
              return;
            }

            const chain = wallets[0].chains[0];
            if (chain.id !== state.chain?.id) {
              state.chain = chain;
            }

            const balance = wallets[0].accounts[0].balance;
            if (balance && balance !== get().balance) {
              state.balance = balance;
            }

            const address = wallets[0].accounts[0].address;
            if (address && address !== get().address) {
              state.address = utils.getAddress(address);
            }

            // TODO: how to !== new provider from old ?
            const provider = new ethers.providers.Web3Provider(
              wallets[0].provider
            );
            if (provider) {
              state.provider = provider;
            }

            const ens = wallets[0].accounts[0].ens?.name;
            if (ens !== get().ens) {
              state.ens = ens;
            }

            const walletName = wallets[0].label;

            if (walletName) {
              state.walletName = walletName;
            }
          })
        );
      },

      login: async (options) => {
        const wallets = await onboard.connectWallet(options);

        if (!wallets[0] || !wallets[0].accounts[0]) {
          set({ status: AuthStatus.Disconnected });
          return;
        }
        get().changeWallet(wallets);
      },

      logout: async () => {
        const wallets = onboard.state.get().wallets;
        for (const { label } of wallets) {
          await onboard.disconnectWallet({ label });
        }

        localStorage.removeItem('connectedWallets');

        set({ ...initialState, status: AuthStatus.Disconnected });
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
