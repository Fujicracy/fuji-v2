import { Position } from "../store/models/Position"
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
