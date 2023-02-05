import { Chain } from '../entities/Chain';
import { ChainId } from '../enums/ChainId';
import { ChainCoingeckoKey, ChainLlamaKey } from '../enums/ChainKey';
import { ChainType } from '../enums/ChainType';
import { ConnextDomain } from '../enums/ConnextDomain';

export const CHAIN: Record<ChainId, Chain> = {
  [ChainId.ETHEREUM]: new Chain(
    ChainId.ETHEREUM,
    ChainType.MAINNET,
    ConnextDomain.ETHEREUM,
    ChainCoingeckoKey.ETHEREUM,
    ChainLlamaKey.ETHEREUM
  ),
  [ChainId.GOERLI]: new Chain(
    ChainId.GOERLI,
    ChainType.TESTNET,
    ConnextDomain.GOERLI,
    ChainCoingeckoKey.GOERLI,
    ChainLlamaKey.ETHEREUM
  ),
  [ChainId.MATIC]: new Chain(
    ChainId.MATIC,
    ChainType.MAINNET,
    ConnextDomain.MATIC,
    ChainCoingeckoKey.MATIC,
    ChainLlamaKey.MATIC
  ),
  [ChainId.MATIC_MUMBAI]: new Chain(
    ChainId.MATIC_MUMBAI,
    ChainType.TESTNET,
    ConnextDomain.MATIC_MUMBAI,
    ChainCoingeckoKey.MATIC_MUMBAI,
    ChainLlamaKey.MATIC
  ),
  [ChainId.FANTOM]: new Chain(
    ChainId.FANTOM,
    ChainType.MAINNET,
    undefined,
    ChainCoingeckoKey.FANTOM,
    ChainLlamaKey.FANTOM
  ),
  [ChainId.ARBITRUM]: new Chain(
    ChainId.ARBITRUM,
    ChainType.MAINNET,
    ConnextDomain.ARBITRUM,
    ChainCoingeckoKey.ARBITRUM,
    ChainLlamaKey.ARBITRUM
  ),
  [ChainId.OPTIMISM]: new Chain(
    ChainId.OPTIMISM,
    ChainType.MAINNET,
    ConnextDomain.OPTIMISM,
    ChainCoingeckoKey.OPTIMISM,
    ChainLlamaKey.OPTIMISM
  ),
  [ChainId.OPTIMISM_GOERLI]: new Chain(
    ChainId.OPTIMISM_GOERLI,
    ChainType.TESTNET,
    ConnextDomain.OPTIMISM_GOERLI,
    ChainCoingeckoKey.OPTIMISM_GOERLI,
    ChainLlamaKey.OPTIMISM
  ),
  [ChainId.GNOSIS]: new Chain(
    ChainId.GNOSIS,
    ChainType.MAINNET,
    ConnextDomain.GNOSIS,
    ChainCoingeckoKey.GNOSIS,
    ChainLlamaKey.GNOSIS
  ),
};
