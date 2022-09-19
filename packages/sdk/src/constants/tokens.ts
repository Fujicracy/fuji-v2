import { TokenMap } from '../types'
import { USDC_ADDRESS, USD_ADDRESS, WETH9_ADDRESS, WNATIVE_ADDRESS } from './addresses'

import { ChainId } from '../enums'
import { Token } from '../entities/Token'

export const USDC: TokenMap = {
  [ChainId.ETHEREUM]: new Token(ChainId.ETHEREUM, USDC_ADDRESS[ChainId.ETHEREUM], 6, 'USDC', 'USD Coin'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, USDC_ADDRESS[ChainId.MATIC], 6, 'USDC', 'USD Coin'),
  [ChainId.MATIC_TESTNET]: new Token(ChainId.MATIC_TESTNET, USDC_ADDRESS[ChainId.MATIC_TESTNET], 6, 'USDC', 'USD Coin'),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, USDC_ADDRESS[ChainId.FANTOM], 6, 'USDC', 'USD Coin'),
  [ChainId.BSC]: new Token(ChainId.BSC, USDC_ADDRESS[ChainId.BSC], 18, 'USDC', 'USD Coin'),
  [ChainId.XDAI]: new Token(ChainId.XDAI, USDC_ADDRESS[ChainId.XDAI], 6, 'USDC', 'USD Coin'),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, USDC_ADDRESS[ChainId.ARBITRUM], 6, 'USDC', 'USD Coin'),
  [ChainId.MOONRIVER]: new Token(ChainId.MOONRIVER, USDC_ADDRESS[ChainId.MOONRIVER], 6, 'USDC', 'USD Coin'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, USDC_ADDRESS[ChainId.AVALANCHE], 6, 'USDC', 'USD Coin'),
  [ChainId.FUSE]: new Token(ChainId.FUSE, USDC_ADDRESS[ChainId.FUSE], 6, 'USDC', 'USD Coin'),
  [ChainId.MOONBEAM]: new Token(ChainId.MOONBEAM, USDC_ADDRESS[ChainId.MOONBEAM], 6, 'USDC', 'USD Coin'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, USDC_ADDRESS[ChainId.OPTIMISM], 6, 'USDC', 'USD Coin'),
  [ChainId.KAVA]: new Token(ChainId.KAVA, USDC_ADDRESS[ChainId.KAVA], 6, 'USDC', 'USD Coin'),
  [ChainId.METIS]: new Token(ChainId.METIS, USDC_ADDRESS[ChainId.METIS], 6, 'USDC', 'USD Coin'),
  [ChainId.ARBITRUM_NOVA]: new Token(ChainId.ARBITRUM_NOVA, USDC_ADDRESS[ChainId.ARBITRUM_NOVA], 6, 'USDC', 'USD Coin'),
}

export const USD: TokenMap = {
  ...USDC,
  [ChainId.CELO]: new Token(ChainId.CELO, USD_ADDRESS[ChainId.CELO], 18, 'cUSD', 'Celo Dollar'),
}

export const WETH9: TokenMap = {
  [ChainId.ETHEREUM]: new Token(ChainId.ETHEREUM, WETH9_ADDRESS[ChainId.ETHEREUM], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.GOERLI]: new Token(ChainId.GOERLI, WETH9_ADDRESS[ChainId.GOERLI], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.ARBITRUM]: new Token(ChainId.ARBITRUM, WETH9_ADDRESS[ChainId.ARBITRUM], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.ARBITRUM_TESTNET]: new Token(
    ChainId.ARBITRUM_TESTNET,
    WETH9_ADDRESS[ChainId.ARBITRUM_TESTNET],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.BSC]: new Token(ChainId.BSC, WETH9_ADDRESS[ChainId.BSC], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, WETH9_ADDRESS[ChainId.FANTOM], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, WETH9_ADDRESS[ChainId.MATIC], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    WETH9_ADDRESS[ChainId.MATIC_TESTNET],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.XDAI]: new Token(ChainId.XDAI, WETH9_ADDRESS[ChainId.XDAI], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, WETH9_ADDRESS[ChainId.AVALANCHE], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.FUSE]: new Token(ChainId.FUSE, WETH9_ADDRESS[ChainId.FUSE], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.MOONBEAM]: new Token(ChainId.MOONBEAM, WETH9_ADDRESS[ChainId.MOONBEAM], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.OPTIMISM]: new Token(ChainId.OPTIMISM, WETH9_ADDRESS[ChainId.OPTIMISM], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.KAVA]: new Token(ChainId.KAVA, WETH9_ADDRESS[ChainId.KAVA], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.METIS]: new Token(ChainId.METIS, WETH9_ADDRESS[ChainId.METIS], 18, 'WETH', 'Wrapped Ether'),
  [ChainId.ARBITRUM_NOVA]: new Token(
    ChainId.ARBITRUM_NOVA,
    WETH9_ADDRESS[ChainId.ARBITRUM_NOVA],
    18,
    'WETH',
    'Wrapped Ether'
  ),
}

export const WNATIVE: TokenMap = {
  [ChainId.ETHEREUM]: WETH9[ChainId.ETHEREUM],
  [ChainId.GOERLI]: WETH9[ChainId.GOERLI],
  [ChainId.OPTIMISM]: WETH9[ChainId.OPTIMISM],
  [ChainId.FANTOM]: new Token(ChainId.FANTOM, WNATIVE_ADDRESS[ChainId.FANTOM], 18, 'WFTM', 'Wrapped FTM'),
  [ChainId.MATIC]: new Token(ChainId.MATIC, WNATIVE_ADDRESS[ChainId.MATIC], 18, 'WMATIC', 'Wrapped Matic'),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    WNATIVE_ADDRESS[ChainId.MATIC_TESTNET],
    18,
    'WMATIC',
    'Wrapped Matic'
  ),
  [ChainId.XDAI]: new Token(ChainId.XDAI, WNATIVE_ADDRESS[ChainId.XDAI], 18, 'WXDAI', 'Wrapped xDai'),
  [ChainId.BSC]: new Token(ChainId.BSC, WNATIVE_ADDRESS[ChainId.BSC], 18, 'WBNB', 'Wrapped BNB'),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    WNATIVE_ADDRESS[ChainId.BSC_TESTNET],
    18,
    'WBNB',
    'Wrapped BNB'
  ),
  [ChainId.ARBITRUM]: WETH9[ChainId.ARBITRUM],
  [ChainId.ARBITRUM_TESTNET]: WETH9[ChainId.ARBITRUM_TESTNET],
  [ChainId.MOONBEAM_TESTNET]: new Token(
    ChainId.MOONBEAM_TESTNET,
    WNATIVE_ADDRESS[ChainId.MOONBEAM_TESTNET],
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.AVALANCHE]: new Token(ChainId.AVALANCHE, WNATIVE_ADDRESS[ChainId.AVALANCHE], 18, 'WAVAX', 'Wrapped AVAX'),
  [ChainId.AVALANCHE_TESTNET]: new Token(
    ChainId.AVALANCHE_TESTNET,
    WNATIVE_ADDRESS[ChainId.AVALANCHE_TESTNET],
    18,
    'WAVAX',
    'Wrapped AVAX'
  ),
  [ChainId.CELO]: new Token(ChainId.CELO, WNATIVE_ADDRESS[ChainId.CELO], 18, 'CELO', 'Celo'),
  [ChainId.MOONRIVER]: new Token(
    ChainId.MOONRIVER,
    WNATIVE_ADDRESS[ChainId.MOONRIVER],
    18,
    'WMOVR',
    'Wrapped Moonriver'
  ),
  [ChainId.FUSE]: new Token(ChainId.FUSE, WNATIVE_ADDRESS[ChainId.FUSE], 18, 'WFUSE', 'Wrapped Fuse'),
  [ChainId.MOONBEAM]: new Token(ChainId.MOONBEAM, WNATIVE_ADDRESS[ChainId.MOONBEAM], 18, 'WGLMR', 'Wrapped Glimmer'),
  [ChainId.KAVA]: new Token(ChainId.KAVA, WNATIVE_ADDRESS[ChainId.KAVA], 18, 'WKAVA', 'Wrapped Kava'),
  [ChainId.METIS]: new Token(ChainId.METIS, WNATIVE_ADDRESS[ChainId.METIS], 18, 'WMETIS', 'Wrapped Metis'),
  [ChainId.ARBITRUM_NOVA]: WETH9[ChainId.ARBITRUM_NOVA],
}

