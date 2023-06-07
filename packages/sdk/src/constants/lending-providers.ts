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
    '0x1Cf617a63eC0134041170134c4625Eb12549217D': {
      name: 'Aave V2',
      llamaKey: 'aave-v2',
    },
    '0xA169a53E5C8c36dD1CfeD0Ceb2BcD15026091272': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0xd3346737E370119961C444c0C1b10d7C3fcDf36C': {
      name: '0VIX',
      llamaKey: '0vix',
    },
    '0x3E29CB29013F0A97A763C21DCCF1fe4Fc21Ec626': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0xefCBD8831eFD775A624f48b49af769992B52056c': {
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
    '0x66211Ab72fB0a06e9E6eD8b21Aa3c1a01F171521': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0x04357b844a321B5d5a2a370aD0CbEF43dAc776Ee': {
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
