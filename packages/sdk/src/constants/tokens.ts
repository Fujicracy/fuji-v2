import { TokenMap } from '../types';
import { USDC_ADDRESS, WETH9_ADDRESS, WNATIVE_ADDRESS } from './addresses';

import { ChainId } from '../enums';
import { Token } from '../entities/Token';

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
};
