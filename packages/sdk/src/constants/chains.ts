import { Chain } from '../entities/Chain';
import { ChainId } from '../enums/ChainId';
import { ChainType } from '../enums/ChainType';
import { ConnextDomain } from '../enums/ConnextDomain';

export const CHAIN: Record<ChainId, Chain> = {
  [ChainId.ETHEREUM]: new Chain(
    ChainId.ETHEREUM,
    ChainType.MAINNET,
    ConnextDomain.ETHEREUM,
    true
  ),
  [ChainId.GOERLI]: new Chain(
    ChainId.GOERLI,
    ChainType.TESTNET,
    ConnextDomain.GOERLI
  ),
  [ChainId.MATIC]: new Chain(
    ChainId.MATIC,
    ChainType.MAINNET,
    ConnextDomain.MATIC,
    true
  ),
  [ChainId.MATIC_MUMBAI]: new Chain(
    ChainId.MATIC_MUMBAI,
    ChainType.TESTNET,
    ConnextDomain.MATIC_MUMBAI
  ),
  [ChainId.FANTOM]: new Chain(ChainId.FANTOM, ChainType.MAINNET, undefined),
  [ChainId.ARBITRUM]: new Chain(
    ChainId.ARBITRUM,
    ChainType.MAINNET,
    ConnextDomain.ARBITRUM,
    true
  ),
  [ChainId.OPTIMISM]: new Chain(
    ChainId.OPTIMISM,
    ChainType.MAINNET,
    ConnextDomain.OPTIMISM,
    true
  ),
  [ChainId.OPTIMISM_GOERLI]: new Chain(
    ChainId.OPTIMISM_GOERLI,
    ChainType.TESTNET,
    ConnextDomain.OPTIMISM_GOERLI
  ),
  [ChainId.GNOSIS]: new Chain(
    ChainId.GNOSIS,
    ChainType.MAINNET,
    ConnextDomain.GNOSIS,
    true
  ),
};
