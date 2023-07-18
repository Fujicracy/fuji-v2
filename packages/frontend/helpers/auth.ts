import coinbaseModule from '@web3-onboard/coinbase';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import mewWallet from '@web3-onboard/mew-wallet';
import trezorModule from '@web3-onboard/trezor';
import walletConnectModule, {
  WalletConnectOptions,
} from '@web3-onboard/walletconnect';
import xdefiWalletModule from '@web3-onboard/xdefi';

import { FUJI_INFO, fujiLogo } from '../constants';
import { onboardChains } from './chains';

type OnboardStatus = {
  hasAcceptedTerms: boolean;
  date?: Date | string;
  wasExploreInfoShown?: boolean;
};

const wcInitOptions: WalletConnectOptions = {
  version: 2,
  projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_V2_KEY}`,
};

const injected = injectedModule();
const walletConnect = walletConnectModule(wcInitOptions);
const coinbase = coinbaseModule();
const ledger = ledgerModule();
const mewWalletModule = mewWallet();
const trezor = trezorModule({
  email: FUJI_INFO.SUPPORT_EMAIL,
  appUrl: FUJI_INFO.APP_URL,
});
const xdefiWallet = xdefiWalletModule();

export const web3onboard = Onboard({
  chains: onboardChains,
  wallets: [
    injected,
    coinbase,
    ledger,
    mewWalletModule,
    trezor,
    walletConnect,
    xdefiWallet,
  ],
  appMetadata: {
    name: FUJI_INFO.NAME,
    icon: fujiLogo, // svg string icon
    description: FUJI_INFO.DESCRIPTION,
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' },
    ],
  },
  accountCenter: {
    desktop: { enabled: false },
    mobile: { enabled: false },
  },
  theme: 'dark',
});

export function acceptTermsOfUse() {
  const onboardStatusJson = localStorage.getItem('termsAccepted') || '{}';
  const onboardStatus = JSON.parse(onboardStatusJson);

  const json = JSON.stringify({
    ...onboardStatus,
    ...{
      hasAcceptedTerms: true,
      date: new Date().toJSON(),
    },
  });
  localStorage.setItem('termsAccepted', json);
}

export function getOnboardStatus(): OnboardStatus {
  const onboardStatusJson = localStorage.getItem('termsAccepted');
  if (!onboardStatusJson) return { hasAcceptedTerms: false };

  const onboardStatus: OnboardStatus = JSON.parse(onboardStatusJson);

  return {
    hasAcceptedTerms: onboardStatus.hasAcceptedTerms,
    date: onboardStatus.date && new Date(onboardStatus.date),
    wasExploreInfoShown: onboardStatus.wasExploreInfoShown,
  };
}

export function setExploreInfoShown(wasExploreInfoShown: boolean) {
  const onboardStatusJson = localStorage.getItem('termsAccepted') || '{}';

  const onboardStatus = JSON.parse(onboardStatusJson);

  const json = JSON.stringify({ ...onboardStatus, wasExploreInfoShown });
  localStorage.setItem('termsAccepted', json);
}
