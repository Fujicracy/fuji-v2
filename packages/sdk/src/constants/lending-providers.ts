import { ChainId } from '../enums';
import { LendingProviderBase } from '../types';

export const LENDING_PROVIDERS: Record<
  ChainId,
  { [address: string]: LendingProviderBase }
> = {
  [ChainId.ETHEREUM]: {},
  [ChainId.GOERLI]: {
    '0xbE55f76cC3f4409C320c8F8D5AF1220c914F7B54': {
      name: 'Aave V2',
      llamaKey: 'aave-v2',
    },
    '0x72d763fbD586C5fF7ECc657ab884F2539eBC6a74': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
  },
  [ChainId.MATIC]: {
    '0xEBdCb08bA47e6a4EC2590140011d8707D76962B8': {
      name: 'Aave V2',
      llamaKey: 'aave-v2',
    },
    '0x5BDE166199Cb85323FcF0282999eaaF7BA6ab5E6': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0xd3346737E370119961C444c0C1b10d7C3fcDf36C': {
      name: '0VIX',
      llamaKey: '0vix',
    },
    '0x2beeCC93A095208375b89547EFd4b3dCa826a927': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0x79D4155045a3CE87051B84E12E398Ad4383F034f': {
      name: 'Compound V3',
      llamaKey: 'compound-v3',
    },
  },
  [ChainId.MATIC_MUMBAI]: {
    '0xC69176FADFeF7A1570540a99Faf827b3138659D1': {
      name: 'Aave V2',
      llamaKey: 'aave-v2',
    },
    '0xd8863e338cf07460c70daa7bb8ea1f9758569b45': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
  },
  [ChainId.FANTOM]: {},
  [ChainId.ARBITRUM]: {
    '0xddadB5dca827f8d59000d610E456630695928660': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0x8755bE098D54Cd16687B7c0D39791Cd899E4dD8c': {
      name: 'Radiant',
      llamaKey: 'radiant',
    },
    '0x12e5BD64CC72C5B2643c3D2C8A88dD05c361e513': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
  },
  [ChainId.OPTIMISM]: {
    '0xB5BeccF2734c97221379a6C08B718D82023b1498': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0x77F535F7B2785FE0fD310dD97d30C5A4E020019A': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0xd3346737E370119961C444c0C1b10d7C3fcDf36C': {
      name: 'WePiggy',
      llamaKey: 'abcd',
    },
  },
  [ChainId.OPTIMISM_GOERLI]: {
    '0xb08b4fc6b8b6cacd69d21f1c94d07fcd4753b5f1': {
      name: 'Aave V2',
      llamaKey: 'aave-v2',
    },
    '0x03c9BA7110F17c080E1B05df507D9dcba8FB157e': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
  },
  [ChainId.GNOSIS]: {
    '0x63d20C47901f6CAe61aA3c19a21ED5f08F8c5112': {
      name: 'Agave',
      llamaKey: 'acryptos',
    },
    '0x305F31582b963A875c3ABD854B9C54D35798b3eF': {
      name: 'Hundred',
      llamaKey: 'abcd',
    },
  },
};
