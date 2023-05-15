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
const wcV1InitOptions: WalletConnectOptions = {
  version: 1,
  qrcodeModalOptions: {
    mobileLinks: [
      'rainbow',
      'metamask',
      'argent',
      'trust',
      'imtoken',
      'pillar',
    ],
  },
};

type OnboardStatus = {
  hasAcceptedTerms: boolean;
  date?: Date | string;
  isExploreInfoSkipped?: boolean;
};

// const wcV2InitOptions: WalletConnectOptions = {
//   version: 2,
//   projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_V2_KEY}`,
// };

const walletConnect = walletConnectModule(wcV1InitOptions);
const coinbase = coinbaseModule();
const ledger = ledgerModule();
const mewWalletModule = mewWallet();
const trezor = trezorModule({
  email: FUJI_INFO.SUPPORT_EMAIL,
  appUrl: FUJI_INFO.APP_URL,
});
const xdefiWallet = xdefiWalletModule();

export function acceptTermsOfUse() {
  const onboardStatus: OnboardStatus = {
    hasAcceptedTerms: true,
    date: new Date().toJSON(),
  };
  const json = JSON.stringify(onboardStatus);
  localStorage.setItem('termsAccepted', json);
}

export function getOnboardStatus(): OnboardStatus {
  const onboardStatusJson = localStorage.getItem('termsAccepted');
  if (!onboardStatusJson) return { hasAcceptedTerms: false };

  const onboardStatus: OnboardStatus = JSON.parse(onboardStatusJson);

  return {
    hasAcceptedTerms: onboardStatus.hasAcceptedTerms,
    date: onboardStatus.date && new Date(onboardStatus.date),
    isExploreInfoSkipped: onboardStatus.isExploreInfoSkipped,
  };
}

export function setExploreInfoSkipped(isExploreInfoSkipped: boolean) {
  const onboardStatusJson = localStorage.getItem('termsAccepted');
  if (!onboardStatusJson) return;

  const onboardStatus: OnboardStatus = JSON.parse(onboardStatusJson);

  const json = JSON.stringify({ ...onboardStatus, isExploreInfoSkipped });
  localStorage.setItem('termsAccepted', json);
}

export function dismissBanner(key: string): void {
  localStorage.setItem(`${key}BannerDismissed`, 'true');
}

export function getBannerVisibility(key: string): boolean {
  const statusJson = localStorage.getItem(`${key}BannerDismissed`);
  return !statusJson || statusJson !== 'true';
}

export const web3onboard = Onboard({
  chains: onboardChains,
  wallets: [
    injectedModule(),
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
