import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import { formatUnits } from '@ethersproject/units';
import { Call } from '@hovoh/ethcall';
import invariant from 'tiny-invariant';

import { FujiErrorCode } from '../constants';
import { FUJI_ORACLE_ADDRESS } from '../constants/addresses';
import { LENDING_PROVIDERS } from '../constants/lending-providers';
import { Address, BorrowingVault, FujiError } from '../entities';
import { Chain } from '../entities/Chain';
import { FujiResult, VaultWithFinancials } from '../types';
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
): Call<Detail>[] => {
  invariant(v.multicallContract, 'BorrowingVault multicallContract not set!');

  return [
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
  ];
};

const getProvidersCalls = (v: BorrowingVault): Call<Rate>[] => {
  invariant(v.allProviders, 'BorrowingVault allProviders not loaded yet!');

  return (
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
) => {
  invariant(
    v.activeProvider && v.allProviders,
    'BorrowingVault activeProvider and allProviders not set!'
  );
  const apIndex = v.allProviders.findIndex((addr) => v.activeProvider === addr);
  const providers = v.allProviders.map((addr, i) => {
    return {
      ...LENDING_PROVIDERS[v.chainId][addr],
      depositAprBase: rateToFloat(rates[2 * i]),
      borrowAprBase: rateToFloat(rates[2 * i + 1]),
    };
  });
  return {
    vault: v,
    depositBalance: detailsBatch[5] as BigNumber,
    borrowBalance: detailsBatch[6] as BigNumber,
    collateralPriceUSD: detailsBatch[7] as BigNumber,
    debtPriceUSD: detailsBatch[8] as BigNumber,
    allProviders: providers,
    activeProvider: providers[apIndex],
  };
};

export async function batchLoad(
  vaults: BorrowingVault[],
  account: Address | undefined,
  chain: Chain
): Promise<FujiResult<VaultWithFinancials[]>> {
  try {
    invariant(chain.connection, 'Chain connection not set!');
    invariant(
      !vaults.find((v) => v.chainId !== chain.chainId),
      'Vault from a different chain!'
    );

    const { multicallRpcProvider } = chain.connection;
    const oracle = FujiOracle__factory.multicall(
      FUJI_ORACLE_ADDRESS[chain.chainId].value
    );

    const detailsBatch: Call<Detail>[][] = vaults.map((v) =>
      getDetailsCalls(v, account, oracle)
    );
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

    const ratesBatch: Call<Rate>[][] = vaults.map((v) => getProvidersCalls(v));

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

    const data = vaults.map((v, i) => {
      const details = detailsBatchResults.slice(
        N_CALLS * i,
        N_CALLS * i + N_CALLS
      );
      const o = offsets[i];
      const rates = ratesBatchResults.slice(o.offset, o.offset + o.len);
      return setResults(v, details, rates);
    });

    return { success: true, data };
  } catch (e: unknown) {
    const code =
      e instanceof String ? FujiErrorCode.SDK : FujiErrorCode.MULTICALL;
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: new FujiError(code, message) };
  }
}
