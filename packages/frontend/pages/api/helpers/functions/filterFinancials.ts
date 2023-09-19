import {
  CHAIN,
  FinancialsResponse,
  FujiError,
  LlamaAssetPool,
  LlamaLendBorrowPool,
  VaultType,
  VaultWithFinancials,
} from '@x-fuji/sdk';

import {
  FinancialsOrError,
  getVaultFinancials,
} from '../../../../helpers/vaults';

export async function filterFinancials(
  data: FinancialsResponse
): Promise<FinancialsResponse> {
  const borrowingResult = await getVaultFinancials(VaultType.BORROW);
  const lendingResult = await getVaultFinancials(VaultType.LEND);
  const allResults: FinancialsOrError[] = borrowingResult.data.concat(
    lendingResult.data
  );
  if (allResults.some((result) => result instanceof FujiError)) {
    throw 'Error fetching vaults from the SDK';
  }
  const allVaults = allResults.filter(
    (result) => !(result instanceof FujiError)
  ) as VaultWithFinancials[];

  const filteredPools = data.pools
    .map((p) => {
      if (
        allVaults.some((v) => {
          const chain = CHAIN[v.vault.chainId].llamaKey;
          const project = v.activeProvider.llamaKey;
          return p.chain === chain && p.project === project;
        })
      )
        return p;
    })
    .filter((p) => p) as LlamaAssetPool[];

  const filteredLendBorrows = data.lendBorrows.filter(
    (b: LlamaLendBorrowPool) => filteredPools.some((p) => p?.pool === b.pool)
  ) as LlamaLendBorrowPool[];
  return { pools: filteredPools, lendBorrows: filteredLendBorrows };
}
