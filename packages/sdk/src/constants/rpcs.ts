import { ChainId } from '../enums';

export const INFURA_RPC_URL: Record<ChainId, (id: string) => string> = {
  [ChainId.ETHEREUM]: (id: string) => `https://mainnet.infura.io/v3/${id}`,
  [ChainId.MATIC]: (id: string) => `https://polygon-mainnet.infura.io/v3/${id}`,
  [ChainId.ARBITRUM]: (id: string) =>
    `https://arbitrum-mainnet.infura.io/v3/${id}`,
  [ChainId.OPTIMISM]: (id: string) =>
    `https://optimism-mainnet.infura.io/v3/${id}`,
  [ChainId.FANTOM]: (_: string) => 'https://rpc.ftm.tools/',
  [ChainId.GOERLI]: (id: string) => `https://goerli.infura.io/v3/${id}`,
  [ChainId.MATIC_MUMBAI]: (id: string) =>
    `https://polygon-mumbai.infura.io/v3/${id}`,
  [ChainId.OPTIMISM_GOERLI]: (id: string) =>
    `https://optimism-goerli.infura.io/v3/${id}`,
};

export const INFURA_WSS_URL: Record<ChainId, (id: string) => string | null> = {
  [ChainId.ETHEREUM]: (id: string) => `wss://mainnet.infura.io/ws/v3/${id}`,
  [ChainId.MATIC]: (_id: string) => null,
  [ChainId.ARBITRUM]: (_id: string) => null,
  [ChainId.OPTIMISM]: (_id: string) => null,
  [ChainId.FANTOM]: (_: string) => null,
  [ChainId.GOERLI]: (id: string) => `wss://goerli.infura.io/ws/v3/${id}`,
  [ChainId.MATIC_MUMBAI]: (_id: string) => null,
  [ChainId.OPTIMISM_GOERLI]: (_id: string) => null,
};
