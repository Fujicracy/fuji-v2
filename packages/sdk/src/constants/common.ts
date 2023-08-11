import { BigNumber } from 'ethers';

// Default values
export const DEFAULT_SLIPPAGE = 50;
export const TOKEN_CACHE_TIMEOUT = 1000 * 60 * 2; // 2 minutes

// Urls
export const URLS = {
  // DefiLlama
  DEFILLAMA_CHART: 'https://yields.llama.fi/chartLendBorrow',
};

export const CONNEXT_URL = (chain: string, transfer: string): string =>
  `https://postgrest.${chain}.connext.ninja/transfers?transfer_id=eq.${transfer}&select=status,execute_transaction_hash`;

export const BN_ZERO = BigNumber.from(0);
