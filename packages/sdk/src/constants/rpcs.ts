import 'dotenv/config';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ChainId } from '../enums';

const INFURA_ID = process.env.INFURA_ID;

export const RPC_URL: { [chainId: number]: string } = {
  [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_ID}`,
  [ChainId.MATIC]: `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.ARBITRUM]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_ID}`,
  [ChainId.OPTIMISM]: `https://optimism-mainnet.infura.io/v3/${INFURA_ID}`,
};

export const RPC_PROVIDER: { [chainId: number]: JsonRpcProvider } = {
  [ChainId.ETHEREUM]: new JsonRpcProvider(RPC_URL[ChainId.ETHEREUM]),
  [ChainId.GOERLI]: new JsonRpcProvider(RPC_URL[ChainId.GOERLI]),
  [ChainId.MATIC]: new JsonRpcProvider(RPC_URL[ChainId.MATIC]),
  [ChainId.ARBITRUM]: new JsonRpcProvider(RPC_URL[ChainId.ARBITRUM]),
  [ChainId.OPTIMISM]: new JsonRpcProvider(RPC_URL[ChainId.OPTIMISM]),
};
