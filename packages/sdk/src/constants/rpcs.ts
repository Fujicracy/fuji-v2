import 'dotenv/config';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ChainId } from '../enums';

const INFURA_ID = process.env.INFURA_ID;

export const RPC_URL: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.MATIC]: `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.ARBITRUM]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.FANTOM]: 'https://rpc.ftm.tools/',
  [ChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_ID}`,
  [ChainId.MATIC_MUMBAI]: `https://polygon-mumbai.infura.io/v3/${INFURA_ID}`,
  [ChainId.OPTIMISM_GOERLI]: `https://optimism-goerli.infura.io/v3/${INFURA_ID}`,
};

export const RPC_PROVIDER: Record<ChainId, JsonRpcProvider> = {
  [ChainId.ETHEREUM]: new JsonRpcProvider(RPC_URL[ChainId.ETHEREUM]),
  [ChainId.MATIC]: new JsonRpcProvider(RPC_URL[ChainId.MATIC]),
  [ChainId.ARBITRUM]: new JsonRpcProvider(RPC_URL[ChainId.ARBITRUM]),
  [ChainId.OPTIMISM]: new JsonRpcProvider(RPC_URL[ChainId.OPTIMISM]),
  [ChainId.FANTOM]: new JsonRpcProvider(RPC_URL[ChainId.FANTOM]),
  [ChainId.GOERLI]: new JsonRpcProvider(RPC_URL[ChainId.GOERLI]),
  [ChainId.MATIC_MUMBAI]: new JsonRpcProvider(RPC_URL[ChainId.MATIC_MUMBAI]),
  [ChainId.OPTIMISM_GOERLI]: new JsonRpcProvider(
    RPC_URL[ChainId.OPTIMISM_GOERLI]
  ),
};
