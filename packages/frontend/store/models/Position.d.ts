import { BorrowingVault, LendingProviderDetails, Token } from "@x-fuji/sdk"

type PositionMeta = {
  amount: number
  token: Token
  usdValue: number
}

// reprensent an open position on fuji
export class Position {
  vault?: BorrowingVault /*| LendingVault // Contain chainId */

  collateral: {
    amount: number
    token: Token
    usdValue: number
    baseAPR?: number
  }
  debt: {
    amount: number
    token: Token
    usdValue: number
    baseAPR?: number
  }

  ltv: number
  ltvMax: number
  ltvThreshold: number

  liquidationPrice: number
  liquidationDiff: number

  activeProvider?: LendingProviderDetails
  providers?: LendingProviderDetails[]
}
