import { Token } from "@x-fuji/sdk"
import { Position } from "../store/models/Position"
import { PositionType } from "./borrow"
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
export function positionInformation(collateral: PositionType): {
  amount: number
  token: Token
  usdValue: number
  estimate?: {
    amount: number
    usdValue: number
  }
} {
  return {
    amount: Number(collateral.input),
    token: collateral.token,
    usdValue: collateral.usdValue,
  }
}
