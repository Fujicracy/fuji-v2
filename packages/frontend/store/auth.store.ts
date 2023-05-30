import { ConnectOptions } from '@web3-onboard/core';
import { Balances, WalletState } from '@web3-onboard/core/dist/types';
import { ChainId } from '@x-fuji/sdk';
import { ethers, utils } from 'ethers';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { getOnboardStatus, web3onboard } from '../helpers/auth';
import { chainIdToHex, hexToChainId } from '../helpers/chains';
import { storeOptions } from '../helpers/stores';

export const onboard = web3onboard;

export enum AuthStatus {
  Initial,
  Connected,
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
};

type AuthActions = {
  login: (options?: ConnectOptions) => void;
  changeWallet: (wallets: WalletState[]) => void;
  showDisclaimer: () => void;
  init: () => void;
  logout: () => void;
  disconnect: () => void;
  changeChain: (chainId: ChainId) => void;
};

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  status: AuthStatus.Initial,
  started: false,
  isDisclaimerShown: false,
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

      showDisclaimer: () => {
        if (!get().isDisclaimerShown) {
          set({ isDisclaimerShown: true });

          return;
        }
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
        get().disconnect();
      },

      disconnect() {
        localStorage.removeItem('connectedWallets');
        set({ ...initialState, status: AuthStatus.Disconnected });
      },

      changeChain: async (chainId) => {
        const hexChainId = chainIdToHex(chainId);
        await onboard.setChain({ chainId: hexChainId });
      },
    }),
    storeOptions('auth')
  )
);
