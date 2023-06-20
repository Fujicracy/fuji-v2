import { ChainId } from '../enums';

export const POKT_RPC_URL: Record<ChainId, (id: string) => string> = {
  [ChainId.ETHEREUM]: (id: string) =>
    `https://eth-mainnet.gateway.pokt.network/v1/lb/${id}`,
  [ChainId.MATIC]: (id: string) =>
    `https://poly-mainnet.gateway.pokt.network/v1/lb/${id}`,
  [ChainId.ARBITRUM]: (id: string) =>
    `https://arbitrum-one.gateway.pokt.network/v1/lb/${id}`,
  [ChainId.OPTIMISM]: (id: string) =>
    `https://optimism-mainnet.gateway.pokt.network/v1/lb/${id}`,
  [ChainId.FANTOM]: (_: string) => 'https://rpc.ftm.tools/',
  [ChainId.GOERLI]: (id: string) =>
    `https://eth-goerli.gateway.pokt.network/v1/lb/${id}`,
  [ChainId.MATIC_MUMBAI]: (id: string) =>
    `https://polygon-mumbai.gateway.pokt.network/v1/lb/${id}`,
  [ChainId.OPTIMISM_GOERLI]: (_: string) => ``,
  [ChainId.GNOSIS]: (id: string) =>
    `https://poa-xdai.gateway.pokt.network/v1/lb/${id}`,
};

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
  [ChainId.GNOSIS]: (_: string) => `https://rpc.gnosischainn.com/`,
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
  [ChainId.GNOSIS]: (_id: string) => null,
};

export const ALCHEMY_WSS_URL: Record<ChainId, (id: string) => string | null> = {
  [ChainId.ETHEREUM]: (_id: string) => null,
  [ChainId.MATIC]: (id: string) =>
    `wss://polygon-mainnet.g.alchemy.com/v2/${id}`,
  [ChainId.ARBITRUM]: (id: string) =>
    `wss://arb-mainnet.g.alchemy.com/v2/${id}`,
  [ChainId.OPTIMISM]: (id: string) =>
    `wss://opt-mainnet.g.alchemy.com/v2/${id}`,
  [ChainId.FANTOM]: (_: string) => null,
  [ChainId.GOERLI]: (_id: string) => null,
  [ChainId.MATIC_MUMBAI]: (id: string) =>
    `wss://polygon-mumbai.g.alchemy.com/v2/${id}`,
  [ChainId.OPTIMISM_GOERLI]: (id: string) =>
    `wss://opt-goerli.g.alchemy.com/v2/${id}`,
  [ChainId.GNOSIS]: (_id: string) => null,
};
