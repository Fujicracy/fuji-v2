import { Palette } from '@mui/material';

import { useBorrow } from '../store/borrow.store';
import { AssetMeta, Position } from '../store/models/Position';
import { usePositions } from '../store/positions.store';
import { AssetChange, Mode } from './assets';
import { formatNumber } from './values';

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
};

export function getRows(positions: Position[]): PositionRow[] {
  if (positions.length === 0) {
    return [];
  } else {
    return positions.map((pos: Position) => ({
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
 * @param position
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

  future.ltvMax = future.ltvMax;
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
    token: source.token,
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
