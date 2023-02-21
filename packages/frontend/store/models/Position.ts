import { BorrowingVault, LendingProviderDetails, Token } from "@x-fuji/sdk"

// reprensent an open position on fuji
export type Position = {
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
