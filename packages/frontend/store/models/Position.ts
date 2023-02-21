import { BorrowingVault, LendingProviderDetails, Token } from "@x-fuji/sdk"

type PositionTypeMeta = {
  amount: number
  token: Token
  usdValue: number
  baseAPR?: number
}

// reprensent an open position on fuji
export type Position = {
  vault?: BorrowingVault /*| LendingVault // Contain chainId */

  collateral: PositionTypeMeta
  debt: PositionTypeMeta

  ltv: number
  ltvMax: number
  ltvThreshold: number

  liquidationPrice: number
  liquidationDiff: number

  activeProvider?: LendingProviderDetails
  providers?: LendingProviderDetails[]
}
