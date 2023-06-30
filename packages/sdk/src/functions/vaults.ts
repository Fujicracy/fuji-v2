import { CHAIN, VAULT_LIST } from '../constants';
import {
  Address,
  Currency,
  FujiResultError,
  FujiResultSuccess,
  Token,
} from '../entities';
import { AbstractVault } from '../entities/abstract/AbstractVault';
import { BorrowingVault } from '../entities/BorrowingVault';
import { ChainId, ChainType, VaultType } from '../enums';
import {
  ChainConfig,
  FujiResult,
  FujiResultPromise,
  VaultWithFinancials,
} from '../types';
import { batchLoad } from './batchLoad';

export function getAllVaults(
  type: VaultType,
  configParams: ChainConfig,
  chainType: ChainType = ChainType.MAINNET
): AbstractVault[] {
  const vaults = [];
  const chains = Object.values(CHAIN).filter((c) => c.chainType === chainType);

  for (const chain of chains) {
    const filtered = _vaultsForType(type, chain.chainId);
    vaults.push(...filtered);
  }

  return vaults.map((v) => v.setConnection(configParams));
}

export async function getVaultsWithFinancials(
  type: VaultType,
  chainId: ChainId,
  configParams: ChainConfig,
  account?: Address
): FujiResultPromise<VaultWithFinancials[]> {
  const chain = CHAIN[chainId];
  if (!chain.isDeployed) {
    return new FujiResultError(`${chain.name} not deployed`);
  }
  const vaults = _vaultsForType(type, chain.chainId).map((v) =>
    v.setConnection(configParams)
  );
  return await batchLoad(vaults, account, chain);
}

export async function getVaultsFor(
  type: VaultType,
  collateral: Currency,
  debt: Currency | undefined,
  configParams: ChainConfig,
  account?: Address
): FujiResultPromise<VaultWithFinancials[]> {
  const _collateral = collateral.isToken ? collateral : collateral.wrapped;
  const _debt = debt ? (debt.isToken ? debt : debt.wrapped) : undefined;

  // find all vaults with this pair
  try {
    const result = findVaultsByTokens(type, _collateral, _debt);
    if (!result.success) {
      return new FujiResultError(result.error.message);
    }
    const _vaults = result.data.map((v: AbstractVault) =>
      v.setConnection(configParams)
    );
    const vaults = [];

    if (debt && debt.chainId !== collateral.chainId) {
      const r1 = _vaults.filter((v) => v.chainId === collateral.chainId);
      const r2 = _vaults.filter((v) => v.chainId === debt.chainId);
      const [a, b] = await Promise.all([
        batchLoad(r1, account, collateral.chain),
        batchLoad(r2, account, debt.chain),
      ]);
      if (a.success && b.success) vaults.push(...a.data, ...b.data);
      else return a.success ? b : a;
    } else {
      const r = await batchLoad(_vaults, account, collateral.chain);
      if (r.success) vaults.push(...r.data);
      else return r;
    }

    // sort them by borrow rate
    const sorted = vaults.sort((a, b) =>
      Number(a.activeProvider?.borrowAprBase) <=
      Number(b.activeProvider?.borrowAprBase)
        ? -1
        : 0
    );
    // TODO: sort by safety rating too

    //if (collateral.chainId === debt.chainId) {
    //// sort again to privilege vaults on the same chain
    //sorted.sort((a) =>
    //a.collateral.chainId === collateral.chainId ? -1 : 0
    //);
    //}

    return new FujiResultSuccess(sorted);
  } catch (error) {
    return new FujiResultError('Error getting vaults');
  }
}

export function findVaultsByTokens(
  type: VaultType,
  collateral: Token,
  debt?: Token
): FujiResult<AbstractVault[]> {
  if (
    (type === VaultType.BORROW && debt === undefined) ||
    (type === VaultType.LEND && debt !== undefined)
  )
    return new FujiResultError('Wrong params');

  const collateralSym = collateral.symbol;
  const debtSym = debt?.symbol;

  const chains = debt
    ? [collateral.chainId, debt.chainId]
    : [collateral.chainId];

  return new FujiResultSuccess(
    Object.entries(VAULT_LIST)
      .map(([, list]) => list)
      .reduce((acc, list) => {
        const vaults = list
          .filter(
            (v: AbstractVault) =>
              chains.includes(v.collateral.chainId) ||
              (v instanceof BorrowingVault && chains.includes(v.debt.chainId))
          )
          .filter((v: AbstractVault) =>
            type === VaultType.BORROW
              ? v.collateral.symbol === collateralSym &&
                v instanceof BorrowingVault &&
                v.debt.symbol === debtSym
              : v.collateral.symbol === collateralSym
          );
        return [...acc, ...vaults];
      }, [])
  );
}

function _vaultsForType(type: VaultType, chainId: ChainId): AbstractVault[] {
  return VAULT_LIST[chainId].filter((v) => v.type === type);
}
