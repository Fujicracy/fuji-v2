import { Token } from "@x-fuji/sdk"
import { useDebugValue } from "react"
import { LTV_RECOMMENDED_DECREASE } from "../constants/borrow"
import { AssetMeta, Position } from "../store/models/Position"
import { AssetChange, LtvMeta, Mode } from "./borrow"
import { formatNumber } from "./values"

export type PositionRow = {
  chainId: number | undefined
  borrow: { sym: string | "-"; amount: number | "-"; usdValue: number | 1 }
  collateral: { sym: string | "-"; amount: number | "-"; usdValue: number | 1 }
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
      borrow: {
        sym: pos.vault?.debt.symbol || "",
        amount: pos.debt.amount,
        usdValue: pos.debt.usdValue,
      },
      collateral: {
        sym: pos.vault?.collateral.symbol || "",
        amount: pos.collateral.amount,
        usdValue: pos.collateral.usdValue,
      },
      apr: formatNumber(pos.debt.baseAPR, 2),
      liquidationPrice: handleDisplayLiquidationPrice(pos.liquidationPrice),
      oraclePrice: formatNumber(
        pos.collateral.usdValue / pos.collateral.amount,
        0
      ),
      get percentPriceDiff() {
        if (this.liquidationPrice === "-" || this.oraclePrice === "-") {
          return 0
        } else {
          return formatNumber(
            ((this.oraclePrice - this.liquidationPrice) * 100) /
              this.oraclePrice,
            0
          )
        }
      },
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

  const collateralPrice =
    current.collateral.usdValue / current.collateral.amount
  const debtPrice = current.debt.usdValue / current.debt.amount

  switch (mode) {
    case Mode.DEPOSIT:
      future.collateral.amount =
        current.collateral.amount + Number(collateral.input)

      future.collateral.usdValue = future.collateral.amount * collateralPrice

    case Mode.BORROW:
      future.debt.amount = current.debt.amount + Number(debt.input)

      future.debt.usdValue = future.debt.amount * debtPrice

    case Mode.WITHDRAW:
      future.collateral.amount =
        current.collateral.amount - Number(collateral.input)

      future.collateral.usdValue = future.collateral.amount * collateralPrice

    case Mode.REPAY:
      future.debt.amount = current.debt.amount - Number(debt.input)

      future.debt.usdValue = future.debt.amount * debtPrice

    case Mode.DEPOSIT_AND_BORROW:
      future.collateral.amount =
        current.collateral.amount + Number(collateral.input)

      future.debt.amount = current.debt.amount + Number(debt.input)

      future.collateral.usdValue = future.collateral.amount * collateralPrice

      future.debt.usdValue = future.debt.amount * debtPrice

    case Mode.PAYBACK_AND_WITHDRAW:
      future.collateral.amount =
        current.collateral.amount - Number(collateral.input)

      future.debt.amount = current.debt.amount - Number(debt.input)

      future.collateral.usdValue = future.collateral.amount * collateralPrice

      future.debt.usdValue = future.debt.amount * debtPrice
  }
  future.ltv = future.debt.usdValue / future.collateral.usdValue

  future.liquidationPrice =
    future.debt.usdValue / (future.ltvThreshold * future.collateral.amount)

  future.liquidationDiff = collateralPrice - future.liquidationPrice
  return future
}

export function viewDynamicPosition(
  dynamic: boolean,
  baseCollateral: AssetChange,
  baseDebt: AssetChange,
  baseLtv: LtvMeta,
  position: Position | undefined = undefined
): Position {
  return {
    collateral: dynamicPositionMeta(
      dynamic,
      baseCollateral,
      position?.collateral
    ),
    debt: dynamicPositionMeta(dynamic, baseDebt, position?.debt),
    ltv: position ? position.ltv : baseLtv.ltv,
    ltvMax: position ? position.ltvMax : baseLtv.ltvMax,
    ltvThreshold: position ? position.ltvThreshold : baseLtv.ltvThreshold,
    liquidationDiff: 0,
    liquidationPrice: 0,
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
    usdValue: source.usdValue, // TODO: This can't just be a copy, it needs to be calculated per the above
    token: source.token,
  }
}
