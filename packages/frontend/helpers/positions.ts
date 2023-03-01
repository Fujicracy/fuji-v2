import { useBorrow } from "../store/borrow.store"
import { AssetMeta, Position } from "../store/models/Position"
import { AssetChange, LtvMeta, Mode } from "./borrow"
import { formatNumber } from "./values"

export type PositionRow = {
  chainId: number | undefined
  debt: { symbol: string | "-"; amount: number | "-"; usdValue: number | 1 }
  collateral: {
    symbol: string | "-"
    amount: number | "-"
    usdValue: number | 1
  }
  apr: number | "-"
  liquidationPrice: number | "-"
  oraclePrice: number | "-"
  percentPriceDiff: number | "-"
  address: string | undefined
}

export function getRows(positions: Position[]): PositionRow[] {
  if (positions.length === 0) {
    return []
  } else {
    const rows: PositionRow[] = positions.map((pos: Position) => ({
      address: pos.vault?.address.value,
      chainId: pos.vault?.chainId,
      debt: {
        symbol: pos.vault?.debt.symbol || "",
        amount: pos.debt.amount,
        usdValue: pos.debt.amount * pos.debt.usdPrice,
      },
      collateral: {
        symbol: pos.vault?.collateral.symbol || "",
        amount: pos.collateral.amount,
        usdValue: pos.collateral.amount * pos.collateral.usdPrice,
      },
      apr: formatNumber(pos.debt.baseAPR, 2),
      liquidationPrice: handleDisplayLiquidationPrice(pos.liquidationPrice),
      oraclePrice: pos.collateral.usdPrice,
      percentPriceDiff: pos.liquidationDiff,
    }))
    return rows
  }
}

function handleDisplayLiquidationPrice(liqPrice: number | undefined) {
  if (liqPrice === undefined || liqPrice === 0) {
    return "-"
  } else {
    return formatNumber(liqPrice, 0)
  }
}

/*
  TODO: Below functions will be used to calculate all overview information.
  They won't be used for borrowing inputs, but they will be used for some
  of the UI there as well, plus the buttons. We need to go one step at the time
  and be really careful about its usage.

  I already started a borrow.store refactor to compartmentalize the data a bit more,
  but I'm sure more changes will be needed.
*/

/*
  TODO: This function atm merely copies the data from the borrow store.
  
  If there's a selected position (passed as param), it needs to show that instead.
  In that case, it needs to also calculate all estimates for that position +
  the user inputted data.
*/

/**
 * @returns The future position according to intended changes in `collateral` or `debt`.
 *
 * @param collateral input changes as `AssetChange`
 * @param debt input changes as `AssetChange`
 * @param position
 * @param mode
 */
export function viewFuturePosition(
  collateral: AssetChange,
  debt: AssetChange,
  current: Position,
  mode: Mode
): Position {
  const future = current
  switch (mode) {
    case Mode.DEPOSIT:
      future.collateral.amount =
        current.collateral.amount + parseFloat(collateral.input)
      break
    case Mode.BORROW:
      future.debt.amount = current.debt.amount + Number(debt.input)
      break
    case Mode.WITHDRAW:
      future.collateral.amount =
        current.collateral.amount - parseFloat(collateral.input)
      break
    case Mode.PAYBACK:
      future.debt.amount = current.debt.amount - Number(debt.input)
      break
    case Mode.DEPOSIT_AND_BORROW:
      future.collateral.amount =
        current.collateral.amount + parseFloat(collateral.input)

      future.debt.amount = current.debt.amount + Number(debt.input)
      break
    case Mode.PAYBACK_AND_WITHDRAW:
      future.collateral.amount =
        current.collateral.amount - parseFloat(collateral.input)

      future.debt.amount = current.debt.amount - Number(debt.input)
      break
  }

  const debtUsdValue = future.debt.amount * future.debt.usdPrice
  const collatUsdValue = future.collateral.amount * future.collateral.usdPrice

  future.ltvMax = future.ltvMax
  future.ltv = (debtUsdValue / collatUsdValue) * 100

  future.liquidationPrice =
    debtUsdValue / (future.ltvThreshold * future.collateral.amount)

  future.liquidationDiff = future.collateral.usdPrice - future.liquidationPrice

  return future
}

export type BasePosition = {
  position: Position
  futurePosition?: Position
}

export function viewDynamicPosition(
  dynamic: boolean,
  position: Position | undefined,
  futurePosition: Position | undefined = undefined
): BasePosition {
  const baseCollateral = useBorrow.getState().collateral
  const baseDebt = useBorrow.getState().debt
  const baseLtv = useBorrow.getState().ltv
  const baseLiquidation = useBorrow.getState().liquidationMeta
  return {
    position: {
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
    futurePosition,
  }
}

export function dynamicPositionMeta(
  dynamic: boolean, // If tue, it means we need to show data the user is inputting
  source: AssetChange,
  positionMeta: AssetMeta | undefined = undefined
): AssetMeta {
  if (positionMeta) return positionMeta
  return {
    amount: dynamic ? Number(source.input) : source.amount,
    usdPrice: source.usdPrice,
    token: source.token,
  }
}
