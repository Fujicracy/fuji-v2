// Default values
export const DEFAULT_SLIPPAGE = 50;
export const TOKEN_CACHE_TIMEOUT = 1000 * 60 * 2; // 2 minutes

// Urls
export const URLS = {
  // DefiLlama
  DEFILLAMA_LEND_BORROW: 'https://yields.llama.fi/lendBorrow',
  DEFILLAMA_POOLS: 'https://yields.llama.fi/pools',
};

export const CONNEXT_URL = (chain: string, transfer: string): string =>
  `https://postgrest.${chain}.connext.ninja/transfers?transfer_id=eq.${transfer}&select=status,execute_transaction_hash`;
