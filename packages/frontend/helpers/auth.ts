import coinbaseModule from '@web3-onboard/coinbase';
import injectedModule from '@web3-onboard/injected-wallets';
import ledgerModule from '@web3-onboard/ledger';
import { init } from '@web3-onboard/react';
import walletConnectModule, {
  WalletConnectOptions,
} from '@web3-onboard/walletconnect';

import { fujiLogo } from '../constants';
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

// const wcV2InitOptions: WalletConnectOptions = {
//   version: 2,
//   projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_V2_KEY}`,
// };

const walletConnect = walletConnectModule(wcV1InitOptions);
const coinbase = coinbaseModule();
const ledger = ledgerModule();

export const web3onboard = init({
  chains: onboardChains,
  wallets: [injectedModule(), coinbase, ledger, walletConnect],
  appMetadata: {
    name: 'Fuji V2 Himalaya',
    icon: fujiLogo, // svg string icon
    description: 'Deposit, borrow and repay from any chain',
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
