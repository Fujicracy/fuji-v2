import { ChainId } from '../enums';
import { LendingProviderBase } from '../types';

export const LENDING_PROVIDERS: Record<
  ChainId,
  { [address: string]: LendingProviderBase }
> = {
  [ChainId.ETHEREUM]: {
    '0x63d20C47901f6CAe61aA3c19a21ED5f08F8c5112': {
      name: 'Aave V2',
      llamaKey: 'aave-v2',
    },
    '0x62a790A77df54Cc75C899a3b27D118958c279A37': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    // e-mode
    '0xed0A749345BF88bf1b5E706cA51F72b4b784CA93': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0x9a24dfDad9cE5B709E4BeEfD8Af72c5B339452Ac': {
      name: 'Compound V2',
      llamaKey: 'compound',
    },
    '0xfCeb53C781df5451dbfFc4C8E3A95bF289E2Bdb3': {
      name: 'Compound V3',
      llamaKey: 'compound-v3',
    },
    '0x77F535F7B2785FE0fD310dD97d30C5A4E020019A': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0x314Cfa1BA6E88B2B2118eD0bECD30D040dA232bf': {
      name: 'Morpho Aave V2',
      llamaKey: 'morpho-aave',
    },
    '0x9DE0CE8Aaa2772f9DB00D223ce9CA17fc430943B': {
      name: 'Morpho Compound',
      llamaKey: 'morpho-compound',
    },
    '0x87874d8Eab4E9a9867d30d100f54C6cb59252563': {
      name: 'Spark Protocol',
      llamaKey: 'spark',
    },
    '0xad65e95E16dA8901C575337bD9a641C7b00908A9': {
      name: 'Spark sDAI',
      llamaKey: 'spark',
    },
  },
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
    // e-mode
    '0x8D4FF0BA361a9360cAEeba55F10a08F32775587c': {
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
    '0x9F76Ad7398C3EcDffC062166490ac8f70184d20b': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0xB4bdb22FC956CcC659B568975A398c1DCAA5D977': {
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
    // e-mode
    '0xa34D2B93ffC304E7D99B1b6bdC28CC2d4F0a58E8': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0x8755bE098D54Cd16687B7c0D39791Cd899E4dD8c': {
      name: 'Radiant',
      llamaKey: 'radiant-v2',
    },
    '0xc0F505224B91Bd50Cd5991CcA8e492563e9b7b72': {
      name: 'dForce',
      llamaKey: 'dforce',
    },
    '0x584E836B7E6c3594c8a285e40f8A1830523Df05D': {
      name: 'Compound V3',
      llamaKey: 'compound-v3',
    },
  },
  [ChainId.OPTIMISM]: {
    '0xB5BeccF2734c97221379a6C08B718D82023b1498': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    // e-mode
    '0x0965D634a98BD702A9b7e40DFed7eAbbEea41b0B': {
      name: 'Aave V3',
      llamaKey: 'aave-v3',
    },
    '0x4A8B5932bcc2075Af7a80169Ee143721387C1E17': {
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
      llamaKey: 'agave',
    },
    '0x305F31582b963A875c3ABD854B9C54D35798b3eF': {
      name: 'Hundred',
      llamaKey: 'abcd',
    },
  },
};
