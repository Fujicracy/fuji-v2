import { ChainId } from '../enums';

export const LENDING_PROVIDERS_LIST: Record<
  ChainId,
  { [address: string]: string }
> = {
  [ChainId.ETHEREUM]: {},
  [ChainId.GOERLI]: {
    '0xbE55f76cC3f4409C320c8F8D5AF1220c914F7B54': 'aave-v2',
    '0x72d763fbD586C5fF7ECc657ab884F2539eBC6a74': 'aave-v3',
  },
  [ChainId.MATIC]: {
    '0xddadB5dca827f8d59000d610E456630695928660': 'aave-v3',
  },
  [ChainId.MATIC_MUMBAI]: {
    '0xC69176FADFeF7A1570540a99Faf827b3138659D1': 'aave-v2',
    '0xd8863e338cf07460c70daa7bb8ea1f9758569b45': 'aave-v3',
  },
  [ChainId.FANTOM]: {},
  [ChainId.ARBITRUM]: {},
  [ChainId.OPTIMISM]: {},
  [ChainId.OPTIMISM_GOERLI]: {
    '0x03c9BA7110F17c080E1B05df507D9dcba8FB157e': 'aave-v3',
    '0xb08b4fc6b8b6cacd69d21f1c94d07fcd4753b5f1': 'aave-v2',
  },
};
