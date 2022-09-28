import { AddressMap } from '../types';
import { ChainId } from '../enums';
import { Address } from '../entities/Address';
import { AddressZero } from '@ethersproject/constants';

export const USDC_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  ),
  [ChainId.MATIC]: Address.from('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
  [ChainId.FANTOM]: Address.from('0x04068DA6C83AFCFA0e13ba15A6696662335D5B75'),
  [ChainId.ARBITRUM]: Address.from(
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'
  ),
  [ChainId.GOERLI]: Address.from('0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x742DfA5Aa70a8212857966D491D67B09Ce7D6ec7'
  ),
};

export const WETH9_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  ),
  [ChainId.ARBITRUM]: Address.from(
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  ),
  [ChainId.FANTOM]: Address.from('0x74b23882a30290451A17c44f4F05243b6b58C76d'),
  [ChainId.MATIC]: Address.from('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'),
  [ChainId.OPTIMISM]: Address.from(
    '0x4200000000000000000000000000000000000006'
  ),
  [ChainId.GOERLI]: Address.from('0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0x4200000000000000000000000000000000000006'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x714550C2C1Ea08688607D86ed8EeF4f5E4F22323'
  ),
};

export const WNATIVE_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: WETH9_ADDRESS[ChainId.ETHEREUM],
  [ChainId.OPTIMISM]: WETH9_ADDRESS[ChainId.OPTIMISM],
  [ChainId.ARBITRUM]: WETH9_ADDRESS[ChainId.ARBITRUM],
  [ChainId.FANTOM]: Address.from('0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'),
  [ChainId.MATIC]: Address.from('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'),
  [ChainId.GOERLI]: WETH9_ADDRESS[ChainId.GOERLI],
  [ChainId.OPTIMISM_GOERLI]: WETH9_ADDRESS[ChainId.OPTIMISM_GOERLI],
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x5B67676a984807a212b1c59eBFc9B3568a474F0a'
  ),
};

export const DAI_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  ),
  [ChainId.MATIC]: Address.from('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'),
  [ChainId.FANTOM]: Address.from('0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E'),
  [ChainId.ARBITRUM]: Address.from(
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
};

export const USDT_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  ),
  [ChainId.MATIC]: Address.from('0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
  [ChainId.FANTOM]: Address.from('0x049d68029688eAbF473097a2fC38ef61633A3C7A'),
  [ChainId.ARBITRUM]: Address.from(
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
};

export const MULTICALL2_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696'
  ),
  [ChainId.ARBITRUM]: Address.from(
    '0x80C7DD17B01855a6D2347444a0FCC36136a314de'
  ),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from('0x22D4cF72C45F8198CfbF4B568dBdB5A85e8DC0B5'),
  [ChainId.MATIC]: Address.from('0x02817C1e3543c2d908a590F5dB6bc97f933dB4BD'),
  [ChainId.GOERLI]: Address.from('0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
};

export const CONNEXT_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(AddressZero),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from('0xD9e8b18Db316d7736A3d0386C59CA3332810df3B'),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xfdA9C9aE45866D12E5008912318bf3c34fc30912'
  ),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xA04f29c24CCf3AF30D4164F608A56Dc495B2c976'
  ),
};

export const CONNEXT_EXECUTOR_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(AddressZero),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from('0x262C3A0228c8A1364A4E29a6cB14EE8a31c349ef'),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
};
