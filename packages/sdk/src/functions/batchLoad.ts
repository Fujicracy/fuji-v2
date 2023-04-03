import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import { formatUnits } from '@ethersproject/units';
import { Call } from '@hovoh/ethcall';

import { FujiErrorCode } from '../constants';
import { FUJI_ORACLE_ADDRESS } from '../constants/addresses';
import { LENDING_PROVIDERS } from '../constants/lending-providers';
import {
  Address,
  BorrowingVault,
  FujiError,
  FujiResultError,
  FujiResultSuccess,
} from '../entities';
import { Chain } from '../entities/Chain';
import { FujiResult, FujiResultPromise, VaultWithFinancials } from '../types';
import {
  FujiOracle__factory,
  ILendingProvider__factory,
} from '../types/contracts';
import { FujiOracleMulticall } from '../types/contracts/src/FujiOracle';

// number of details calls per vault
const N_CALLS = 9;

type Detail = BigNumber | string | string[];
type Rate = BigNumber;

// rates are with 27 decimals
const rateToFloat = (n: BigNumber) =>
  parseFloat(formatUnits(n.toString(), 27)) * 100;

const getDetailsCalls = (
  v: BorrowingVault,
  account: Address | undefined,
  oracle: FujiOracleMulticall
): FujiResult<Call<Detail>[]> => {
  if (!v.multicallContract) {
    return new FujiResultError('BorrowingVault multicallContract not set!');
  }

  return new FujiResultSuccess([
    v.multicallContract.maxLtv() as Call<BigNumber>,
    v.multicallContract.liqRatio() as Call<BigNumber>,
    v.multicallContract.name() as Call<string>,
    v.multicallContract.activeProvider() as Call<string>,
    v.multicallContract.getProviders() as Call<string[]>,
    v.multicallContract.balanceOfAsset(
      account?.value ?? AddressZero
    ) as Call<BigNumber>,
    v.multicallContract?.balanceOfDebt(
      account?.value ?? AddressZero
    ) as Call<BigNumber>,
    oracle.getPriceOf(
      AddressZero,
      v.collateral.address.value,
      v.collateral.decimals
    ),
    oracle.getPriceOf(AddressZero, v.debt.address.value, v.debt.decimals),
  ]);
};

const getProvidersCalls = (v: BorrowingVault): FujiResult<Call<Rate>[]> => {
  if (!v.allProviders) {
    return new FujiResultError('BorrowingVault allProviders not set!');
  }

  return new FujiResultSuccess(
    v.allProviders
      .map((addr) => [
        ILendingProvider__factory.multicall(addr).getDepositRateFor(
          v.address.value
        ),
        ILendingProvider__factory.multicall(addr).getBorrowRateFor(
          v.address.value
        ),
      ])
      // flatten [][] to []
      .reduce((acc, b) => acc.concat(...b), [])
  );
};

const setResults = (
  v: BorrowingVault,
  detailsBatch: Detail[],
  rates: Rate[]
): FujiResult<VaultWithFinancials> => {
  if (!v.activeProvider || !v.allProviders) {
    return new FujiResultError(
      'BorrowingVault activeProvider and allProviders not set!'
    );
  }
  const apIndex = v.allProviders.findIndex((addr) => v.activeProvider === addr);
  const providers = v.allProviders.map((addr, i) => {
    return {
      ...LENDING_PROVIDERS[v.chainId][addr],
      depositAprBase: rateToFloat(rates[2 * i]),
      borrowAprBase: rateToFloat(rates[2 * i + 1]),
    };
  });
  return new FujiResultSuccess({
    vault: v,
    depositBalance: detailsBatch[5] as BigNumber,
    borrowBalance: detailsBatch[6] as BigNumber,
    collateralPriceUSD: detailsBatch[7] as BigNumber,
    debtPriceUSD: detailsBatch[8] as BigNumber,
    allProviders: providers,
    activeProvider: providers[apIndex],
  });
};

export async function batchLoad(
  vaults: BorrowingVault[],
  account: Address | undefined,
  chain: Chain
): FujiResultPromise<VaultWithFinancials[]> {
  if (!chain.connection) {
    return new FujiResultError('Chain connection not set!', FujiErrorCode.SDK, {
      chainId: chain.chainId,
    });
  }
  if (vaults.find((v) => v.chainId !== chain.chainId)) {
    return new FujiResultError(
      'Vault from a different chain!',
      FujiErrorCode.SDK,
      {
        chainId: chain.chainId,
      }
    );
  }
  try {
    const { multicallRpcProvider } = chain.connection;
    const oracle = FujiOracle__factory.multicall(
      FUJI_ORACLE_ADDRESS[chain.chainId].value
    );

    const batchResult = vaults.map((v) => getDetailsCalls(v, account, oracle));
    let error = batchResult.find((r): r is FujiResultError => !r.success);
    if (error)
      return new FujiResultError(error.error.message, error.error.code);

    const detailsBatch = (
      batchResult as FujiResultSuccess<Call<Detail>[]>[]
    ).map((r) => r.data);

    const detailsBatchResults = await multicallRpcProvider.all(
      // flatten [][] to []
      detailsBatch.reduce((acc, b) => acc.concat(...b), [])
    );

    vaults.forEach((v, i) => {
      const maxLtv = detailsBatchResults[N_CALLS * i] as BigNumber;
      const liqRatio = detailsBatchResults[N_CALLS * i + 1] as BigNumber;
      const name = detailsBatchResults[N_CALLS * i + 2] as string;
      const activeProvider = detailsBatchResults[N_CALLS * i + 3] as string;
      const allProviders = detailsBatchResults[N_CALLS * i + 4] as string[];
      v.setPreLoads(maxLtv, liqRatio, name, activeProvider, allProviders);
    });

    const ratesResult = vaults.map((v) => getProvidersCalls(v));
    error = ratesResult.find((r): r is FujiResultError => !r.success);
    if (error)
      return new FujiResultError(error.error.message, error.error.code);

    const ratesBatch = (ratesResult as FujiResultSuccess<Call<Rate>[]>[]).map(
      (r) => r.data
    );

    // Every vault has a different amount of lending providers.
    // We can't use the same mechanics as for detailsBatch
    // where every vault has a fixed number of attributes.
    // We have to pass a flattened array of calls and
    // that's why for the rates we need to set offsets and length for each vault.
    let memo = 0;
    const offsets: { offset: number; len: number }[] = ratesBatch.map(
      (batch: Call<Rate>[]) => {
        const o = { offset: memo, len: batch.length };
        memo += batch.length;
        return o;
      }
    );
    const ratesBatchResults = await multicallRpcProvider.all(
      // flatten [][] to []
      ratesBatch.reduce((acc, v) => acc.concat(...v), [])
    );

    const result = vaults.map((v, i) => {
      const details = detailsBatchResults.slice(
        N_CALLS * i,
        N_CALLS * i + N_CALLS
      );
      const o = offsets[i];
      const rates = ratesBatchResults.slice(o.offset, o.offset + o.len);
      return setResults(v, details, rates);
    });
    error = result.find((r): r is FujiResultError => !r.success);
    if (error)
      return new FujiResultError(error.error.message, error.error.code);
    const data = (result as FujiResultSuccess<VaultWithFinancials>[]).map(
      (r) => r.data
    );

    return new FujiResultSuccess(data);
  } catch (e: unknown) {
    const message = FujiError.messageFromUnknownError(e);
    return new FujiResultError(message);
  }
}
