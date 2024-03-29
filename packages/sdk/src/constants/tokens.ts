import { AddressZero } from '@ethersproject/constants';

import { Address } from '../entities/Address';
import { Token } from '../entities/Token';
import { ChainId } from '../enums';
import { TokenMap } from '../types';
import {
  CBETH_ADDRESS,
  DAI_ADDRESS,
  GHO_ADDRESS,
  GNO_ADDRESS,
  RETH_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS,
  WETH9_ADDRESS,
  WNATIVE_ADDRESS,
  WSTETH_ADDRESS,
} from './addresses';

export const USDC: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    USDC_ADDRESS[ChainId.ETHEREUM],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    USDC_ADDRESS[ChainId.GOERLI],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    USDC_ADDRESS[ChainId.MATIC],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    USDC_ADDRESS[ChainId.MATIC_MUMBAI],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    USDC_ADDRESS[ChainId.FANTOM],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    USDC_ADDRESS[ChainId.ARBITRUM],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    USDC_ADDRESS[ChainId.OPTIMISM],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    USDC_ADDRESS[ChainId.OPTIMISM_GOERLI],
    6,
    'USDC',
    'USD Coin'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    USDC_ADDRESS[ChainId.GNOSIS],
    6,
    'USDC',
    'USD Coin'
  ),
};

export const USDT: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    USDT_ADDRESS[ChainId.ETHEREUM],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    USDT_ADDRESS[ChainId.GOERLI],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    USDT_ADDRESS[ChainId.MATIC],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    USDT_ADDRESS[ChainId.MATIC_MUMBAI],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    USDT_ADDRESS[ChainId.FANTOM],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    USDT_ADDRESS[ChainId.ARBITRUM],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    USDT_ADDRESS[ChainId.OPTIMISM],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    USDT_ADDRESS[ChainId.OPTIMISM_GOERLI],
    6,
    'USDT',
    'Tether'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    USDT_ADDRESS[ChainId.GNOSIS],
    6,
    'USDT',
    'Tether'
  ),
};

export const DAI: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    DAI_ADDRESS[ChainId.ETHEREUM],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    DAI_ADDRESS[ChainId.GOERLI],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    DAI_ADDRESS[ChainId.MATIC],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    DAI_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    DAI_ADDRESS[ChainId.FANTOM],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    DAI_ADDRESS[ChainId.ARBITRUM],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    DAI_ADDRESS[ChainId.OPTIMISM],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    DAI_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'DAI',
    'Dai Stablecoin'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    Address.from(AddressZero),
    18,
    'xDAI',
    'xDai'
  ),
};

export const GHO: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    GHO_ADDRESS[ChainId.ETHEREUM],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    GHO_ADDRESS[ChainId.GOERLI],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    GHO_ADDRESS[ChainId.MATIC],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    GHO_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    GHO_ADDRESS[ChainId.FANTOM],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    GHO_ADDRESS[ChainId.ARBITRUM],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    GHO_ADDRESS[ChainId.OPTIMISM],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    GHO_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'GHO',
    'Gho Token'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    Address.from(AddressZero),
    18,
    'GHO',
    'Gho Token'
  ),
};

export const WETH9: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    WETH9_ADDRESS[ChainId.ETHEREUM],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    WETH9_ADDRESS[ChainId.GOERLI],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    WETH9_ADDRESS[ChainId.ARBITRUM],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    WETH9_ADDRESS[ChainId.FANTOM],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    WETH9_ADDRESS[ChainId.MATIC],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    WETH9_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    WETH9_ADDRESS[ChainId.OPTIMISM],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    WETH9_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    WETH9_ADDRESS[ChainId.GNOSIS],
    18,
    'WETH',
    'Wrapped Ether'
  ),
};

export const MATICX = new Token(
  ChainId.MATIC,
  Address.from('0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6'),
  18,
  'MaticX',
  'Liquid Staking Matic'
);

export const WSTETH: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    WSTETH_ADDRESS[ChainId.ETHEREUM],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    WSTETH_ADDRESS[ChainId.GOERLI],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    WSTETH_ADDRESS[ChainId.ARBITRUM],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    WSTETH_ADDRESS[ChainId.OPTIMISM],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    WSTETH_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    WSTETH_ADDRESS[ChainId.FANTOM],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    WSTETH_ADDRESS[ChainId.MATIC],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    WSTETH_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    WSTETH_ADDRESS[ChainId.GNOSIS],
    18,
    'wstETH',
    'Wrapped liquid staked Ether 2.0'
  ),
};

export const RETH: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    RETH_ADDRESS[ChainId.ETHEREUM],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    RETH_ADDRESS[ChainId.GOERLI],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    RETH_ADDRESS[ChainId.ARBITRUM],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    RETH_ADDRESS[ChainId.OPTIMISM],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    RETH_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    RETH_ADDRESS[ChainId.FANTOM],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    RETH_ADDRESS[ChainId.MATIC],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    RETH_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    RETH_ADDRESS[ChainId.GNOSIS],
    18,
    'rETH',
    'Rocket Pool ETH'
  ),
};

export const CBETH: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    CBETH_ADDRESS[ChainId.ETHEREUM],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    CBETH_ADDRESS[ChainId.GOERLI],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    CBETH_ADDRESS[ChainId.ARBITRUM],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    CBETH_ADDRESS[ChainId.OPTIMISM],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    CBETH_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    CBETH_ADDRESS[ChainId.FANTOM],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    CBETH_ADDRESS[ChainId.MATIC],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    CBETH_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    CBETH_ADDRESS[ChainId.GNOSIS],
    18,
    'cbETH',
    'Coinbase Wrapped Staked ETH'
  ),
};

export const GNO: TokenMap = {
  [ChainId.ETHEREUM]: new Token(
    ChainId.ETHEREUM,
    GNO_ADDRESS[ChainId.ETHEREUM],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.GOERLI]: new Token(
    ChainId.GOERLI,
    GNO_ADDRESS[ChainId.GOERLI],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    GNO_ADDRESS[ChainId.ARBITRUM],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    GNO_ADDRESS[ChainId.OPTIMISM],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.OPTIMISM_GOERLI]: new Token(
    ChainId.OPTIMISM_GOERLI,
    GNO_ADDRESS[ChainId.OPTIMISM_GOERLI],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    GNO_ADDRESS[ChainId.FANTOM],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    GNO_ADDRESS[ChainId.MATIC],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    GNO_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'GNO',
    'Gnosis Token'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    GNO_ADDRESS[ChainId.GNOSIS],
    18,
    'GNO',
    'Gnosis Token on xDai'
  ),
};

export const WNATIVE: TokenMap = {
  [ChainId.ETHEREUM]: WETH9[ChainId.ETHEREUM],
  [ChainId.GOERLI]: WETH9[ChainId.GOERLI],
  [ChainId.OPTIMISM]: WETH9[ChainId.OPTIMISM],
  [ChainId.ARBITRUM]: WETH9[ChainId.ARBITRUM],
  [ChainId.OPTIMISM_GOERLI]: WETH9[ChainId.OPTIMISM_GOERLI],
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    WNATIVE_ADDRESS[ChainId.FANTOM],
    18,
    'WFTM',
    'Wrapped FTM'
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    WNATIVE_ADDRESS[ChainId.MATIC],
    18,
    'WMATIC',
    'Wrapped Matic'
  ),
  [ChainId.MATIC_MUMBAI]: new Token(
    ChainId.MATIC_MUMBAI,
    WNATIVE_ADDRESS[ChainId.MATIC_MUMBAI],
    18,
    'WMATIC',
    'Wrapped Matic'
  ),
  [ChainId.GNOSIS]: new Token(
    ChainId.GNOSIS,
    WNATIVE_ADDRESS[ChainId.GNOSIS],
    18,
    'WXDAI',
    'Wrapped xDai'
  ),
};
