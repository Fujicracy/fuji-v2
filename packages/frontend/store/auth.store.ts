import { ConnectOptions } from '@web3-onboard/core';
import { Balances, WalletState } from '@web3-onboard/core/dist/types';
import { ChainId, DEFAULT_SLIPPAGE } from '@x-fuji/sdk';
import { ethers, utils } from 'ethers';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { getOnboardStatus, web3onboard } from '../helpers/auth';
import { chainIdToHex, hexToChainId } from '../helpers/chains';
import { stringifyError } from '../helpers/errors';
import { notify } from '../helpers/notifications';
import { storeOptions } from '../helpers/stores';

export const onboard = web3onboard;

export enum AuthStatus {
  Initial,
  Connected,
  Connecting,
  Disconnected,
}

type AuthState = {
  status: AuthStatus;
  isDisclaimerShown: boolean;
  started: boolean;
  address?: string;
  ens?: string;
  balance?: Balances;
  chainId?: ChainId;
  provider?: ethers.providers.Web3Provider;
  walletName?: string;
  slippage: number;
};

type AuthActions = {
  login: (options?: ConnectOptions) => void;
  changeWallet: (wallets: WalletState[]) => void;
  init: () => void;
  logout: () => void;
  disconnect: () => void;
  changeChain: (chainId: ChainId) => void;
  changeSlippageValue: (slippage: number) => void;
};

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  status: AuthStatus.Initial,
  started: false,
  isDisclaimerShown: false,
  slippage: DEFAULT_SLIPPAGE,
};

export const useAuth = create<AuthStore>()(
  persist(
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

          if (
            !get().isDisclaimerShown &&
            !getOnboardStatus().hasAcceptedTerms
          ) {
            set({ status: AuthStatus.Disconnected });
            return;
          }

          get().login({
            autoSelect: { label: wallets[0], disableModals: true },
          });
        },

        changeWallet(wallets) {
          const balance = wallets[0].accounts[0].balance;
          const ens = wallets[0].accounts[0].ens?.name;
          const address = utils.getAddress(wallets[0].accounts[0].address);
          const chainId = hexToChainId(wallets[0].chains[0]?.id);
          const provider = new ethers.providers.Web3Provider(
            wallets[0].provider
          );

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

        login: async (options) => {
          if (
            !get().isDisclaimerShown &&
            !getOnboardStatus().hasAcceptedTerms
          ) {
            set({ isDisclaimerShown: true });
            set({ status: AuthStatus.Disconnected });

            return;
          }

          set({ status: AuthStatus.Connecting });
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
          get().disconnect();
        },

        disconnect() {
          localStorage.removeItem('connectedWallets');
          set({ ...initialState, status: AuthStatus.Disconnected });
        },

        changeChain: async (chainId) => {
          const hexChainId = chainIdToHex(chainId);
          try {
            await onboard.setChain({ chainId: hexChainId });
          } catch (error) {
            notify({
              message: stringifyError(error),
              type: 'error',
            });
          }
        },

        changeSlippageValue(slippage) {
          set({ slippage });
        },
      }),
      storeOptions('auth')
    ),
    {
      name: 'xFuji/auth',
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
