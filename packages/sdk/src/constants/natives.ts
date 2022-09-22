import { Ether, Fantom, Matic } from '../entities/native';

import { ChainId } from '../enums';
import { NativeMap } from '../types';

export const NATIVE: NativeMap = {
  [ChainId.ETHEREUM]: Ether.onChain(ChainId.ETHEREUM),
  [ChainId.GOERLI]: Ether.onChain(ChainId.GOERLI),
  [ChainId.FANTOM]: Fantom.onChain(ChainId.FANTOM),
  [ChainId.MATIC]: Matic.onChain(ChainId.MATIC),
  [ChainId.MATIC_MUMBAI]: Matic.onChain(ChainId.MATIC),
  [ChainId.ARBITRUM]: Ether.onChain(ChainId.ARBITRUM),
  [ChainId.OPTIMISM]: Ether.onChain(ChainId.OPTIMISM),
  [ChainId.OPTIMISM_GOERLI]: Ether.onChain(ChainId.OPTIMISM),
};
