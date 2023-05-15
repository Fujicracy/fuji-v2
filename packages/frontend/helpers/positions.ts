import { Palette } from '@mui/material';
import {
  Address,
  FujiResultError,
  FujiResultPromise,
  FujiResultSuccess,
  LendingProviderDetails,
} from '@x-fuji/sdk';
import { BigNumber } from 'ethers';

import { useBorrow } from '../store/borrow.store';
import { AssetMeta, Position } from '../store/models/Position';
import { usePositions } from '../store/positions.store';
import { AssetChange, AssetType, Mode } from './assets';
import { getAllBorrowingVaultFinancials } from './borrow';
import { bigToFloat, formatNumber } from './values';

export const getTotalSum = (
  positions: Position[],
  param: AssetType
): number => {
  return positions.reduce((s, p) => p[param].amount * p[param].usdPrice + s, 0);
};

export const getPositionsWithBalance = async (
  addr: string
): FujiResultPromise<Position[]> => {
  const account = Address.from(addr);

  const result = await getAllBorrowingVaultFinancials(account);

  if (result.errors.length > 0) {
    // Should we keep going with the returned vaults? Don't think so
    const firstError = result.errors[0];
    return new FujiResultError(
      firstError.message,
      firstError.code,
      firstError.info
    );
  }

  const allVaults = result.data;
  const vaultsWithBalance = allVaults.filter((v) =>
    v.depositBalance.gt(BigNumber.from('0'))
  );

  const vaults = vaultsWithBalance.map((v) => {
    const p = {} as Position;
    p.vault = v.vault;
    p.collateral = {
      amount: bigToFloat(v.depositBalance, v.vault.collateral.decimals),
      currency: v.vault.collateral,
      usdPrice: bigToFloat(v.collateralPriceUSD, v.vault.collateral.decimals),
      get baseAPR() {
        return v.activeProvider.depositAprBase;
      },
    };
    p.debt = {
      amount: bigToFloat(v.borrowBalance, v.vault.debt.decimals),
      currency: v.vault.debt,
      usdPrice: bigToFloat(v.debtPriceUSD, v.vault.debt.decimals),
      get baseAPR() {
        return v.activeProvider.borrowAprBase;
      },
    };
    p.ltv =
      (p.debt.amount * p.debt.usdPrice) /
      (p.collateral.amount * p.collateral.usdPrice);
    p.ltvMax = bigToFloat(v.vault.maxLtv, 18);
    p.ltvThreshold = bigToFloat(v.vault.liqRatio, 18);
    p.liquidationPrice =
      p.debt.usdPrice === 0
        ? 0
        : (p.debt.amount * p.debt.usdPrice) /
          (p.ltvThreshold * p.collateral.amount);
    p.liquidationDiff =
      p.liquidationPrice === 0
        ? 0
        : Math.round((1 - p.liquidationPrice / p.collateral.usdPrice) * 100);
    p.activeProvidersNames = v.allProviders.map((provider) => provider.name);
    return p;
  });

  return new FujiResultSuccess(vaults);
};

export const getAccrual = (
  usdBalance: number,
  baseAPR: number | undefined,
  param: 'collateral' | 'debt'
): number => {
  const factor = param === 'debt' ? -1 : 1;
  // `baseAPR` returned bu SDK is formatted in %, therefore to get decimal we divide by 100.
  const aprDecimal = baseAPR ? baseAPR / 100 : 0;
  // Blockchain APR compounds per block, and daily compounding is a close estimation for APY
  const apyDecimal = (1 + aprDecimal / 365) ** 365 - 1;
  return factor * usdBalance * apyDecimal;
};

export const getCurrentAvailableBorrowingPower = (
  positions: Position[]
): number => {
  return positions.reduce((b, pos) => {
    const collateralUsdValue = pos.collateral.amount * pos.collateral.usdPrice;
    const debtUsdValue = pos.debt.amount * pos.debt.usdPrice;
    return collateralUsdValue * pos.ltvMax - debtUsdValue + b;
  }, 0);
};

export type PositionRow = {
  chainId: number | undefined;
  debt: {
    symbol: string | '-';
    amount: number | '-';
    usdValue: number | 1;
    baseAPR?: number | 0;
  };
  collateral: {
    symbol: string | '-';
    amount: number | '-';
    usdValue: number | 1;
    baseAPR?: number | 0;
  };
  apr: number | '-';
  liquidationPrice: number | '-';
  oraclePrice: number | '-';
  percentPriceDiff: number | '-';
  address: string | undefined;
  ltv: number | 0;
  ltvMax: number | 0;
  safetyRating: number | 0;
  activeProvidersNames: string[];
};

export function getRows(positions: Position[]): PositionRow[] {
  if (positions.length === 0) {
    return [];
  } else {
    return positions.map((pos: Position) => ({
      safetyRating: Number(pos.vault?.safetyRating?.toString()) ?? 0,
      address: pos.vault?.address.value,
      chainId: pos.vault?.chainId,
      debt: {
        symbol: pos.vault?.debt.symbol || '',
        amount: pos.debt.amount,
        usdValue: pos.debt.amount * pos.debt.usdPrice,
        baseAPR: pos.debt.baseAPR,
      },
      collateral: {
        symbol: pos.vault?.collateral.symbol || '',
        amount: pos.collateral.amount,
        usdValue: pos.collateral.amount * pos.collateral.usdPrice,
        baseAPR: pos.collateral.baseAPR,
      },
      apr: formatNumber(pos.debt.baseAPR, 2),
      liquidationPrice: handleDisplayLiquidationPrice(pos.liquidationPrice),
      oraclePrice: pos.collateral.usdPrice,
      percentPriceDiff: pos.liquidationDiff,
      ltv: pos.ltv * 100,
      ltvMax: pos.ltvMax * 100,
      activeProvidersNames: pos.activeProvidersNames,
    }));
  }
}

function handleDisplayLiquidationPrice(liqPrice: number | undefined) {
  if (liqPrice === undefined || liqPrice === 0) {
    return '-';
  } else {
    return formatNumber(liqPrice, 0);
  }
}

/**
 * @returns The edited position according to intended changes in `collateral` or `debt`.
 *
 * @param collateral input changes as `AssetChange`
 * @param debt input changes as `AssetChange`
 * @param current
 * @param mode
 */
export function viewEditedPosition(
  collateral: AssetChange,
  debt: AssetChange,
  current: Position,
  mode: Mode
): Position {
  const future = JSON.parse(JSON.stringify(current));
  const collateralInput = parseFloat(
    collateral.input === '' ? '0' : collateral.input
  );
  const debtInput = parseFloat(debt.input === '' ? '0' : debt.input);
  switch (mode) {
    case Mode.DEPOSIT:
      future.collateral.amount = current.collateral.amount + collateralInput;
      break;
    case Mode.BORROW:
      future.debt.amount = current.debt.amount + debtInput;
      break;
    case Mode.WITHDRAW:
      future.collateral.amount = current.collateral.amount - collateralInput;
      break;
    case Mode.PAYBACK:
      future.debt.amount = current.debt.amount - debtInput;
      break;
    case Mode.DEPOSIT_AND_BORROW:
      future.collateral.amount = current.collateral.amount + collateralInput;

      future.debt.amount = current.debt.amount + debtInput;
      break;
    case Mode.PAYBACK_AND_WITHDRAW:
      future.collateral.amount = current.collateral.amount - collateralInput;

      future.debt.amount = current.debt.amount - debtInput;
      break;
  }

  const debtUsdValue = future.debt.amount * future.debt.usdPrice;
  const collatUsdValue = future.collateral.amount * future.collateral.usdPrice;

  future.ltv = (debtUsdValue / collatUsdValue) * 100;

  future.liquidationPrice =
    debtUsdValue / (future.ltvThreshold * future.collateral.amount);

  future.liquidationDiff = future.collateral.usdPrice - future.liquidationPrice;

  future.ltvThreshold = future.ltvThreshold * 100;

  return future;
}

export type BasePosition = {
  position: Position;
  editedPosition?: Position;
};

export function viewDynamicPosition(
  dynamic: boolean,
  position: Position | undefined,
  editedPosition: Position | undefined = undefined
): BasePosition {
  const baseCollateral = useBorrow.getState().collateral;
  const baseDebt = useBorrow.getState().debt;
  const baseLtv = useBorrow.getState().ltv;
  const baseLiquidation = useBorrow.getState().liquidationMeta;
  return {
    position: {
      vault: position?.vault,
      collateral: dynamicPositionMeta(
        dynamic,
        baseCollateral,
        position?.collateral
      ),
      debt: dynamicPositionMeta(dynamic, baseDebt, position?.debt),
      ltv: position ? 100 * position.ltv : baseLtv.ltv,
      ltvMax: position ? 100 * position.ltvMax : baseLtv.ltvMax,
      ltvThreshold: position
        ? 100 * position.ltvThreshold
        : baseLtv.ltvThreshold,
      liquidationDiff: position
        ? position.liquidationDiff
        : baseLiquidation.liquidationDiff,
      liquidationPrice: position
        ? position.liquidationPrice
        : baseLiquidation.liquidationPrice,
      activeProvidersNames: position?.activeProvidersNames || [],
    },
    editedPosition,
  };
}

export function dynamicPositionMeta(
  dynamic: boolean, // If tue, it means we need to show data the user is inputting
  source: AssetChange,
  positionMeta: AssetMeta | undefined = undefined
): AssetMeta {
  if (positionMeta) return positionMeta;
  return {
    amount: dynamic ? Number(source.input) : source.amount,
    usdPrice: source.usdPrice,
    currency: source.currency,
  };
}

export function getEstimatedEarnings({
  days,
  collateralInUsd,
  debtInUsd,
  collateralAPR = 1,
  debtAPR = 1,
}: {
  days: number;
  collateralInUsd: number;
  debtInUsd: number;
  collateralAPR?: number;
  debtAPR?: number;
}) {
  return (
    ((collateralInUsd * collateralAPR - debtInUsd * debtAPR) / 100 / 365) * days
  );
}

export function vaultFromAddress(address: string | undefined) {
  if (!address) return undefined;
  const positions = usePositions.getState().positions;
  return positions.find((pos) => pos.vault?.address.value === address)?.vault;
}

export function liquidationColor(
  percentage: number | string,
  recommended: number | undefined,
  palette: Palette
) {
  if (typeof percentage === 'string' || !recommended) return palette.info.main;
  return percentage <= recommended
    ? palette.success.main
    : palette.warning.main;
}

export function belowPriceColor(
  percentage: number | string,
  min: number | undefined,
  palette: Palette
) {
  if (typeof percentage === 'string' || !min) return palette.info.main;
  if (percentage <= 5) return palette.error.main;
  return percentage <= min ? palette.warning.main : palette.success.main;
}
