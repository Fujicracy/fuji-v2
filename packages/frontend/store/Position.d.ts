import { BorrowingVault, LendingProviderDetails, Token } from "@x-fuji/sdk"

// reprensent an open position on fuji
export interface Position {
  vault?: BorrowingVault // Contain chainId

  collateral: {
    amount: number
    token: Token
    usdValue: number
  }

  debt: {
    amount: number
    token: Token
    usdValue: number
  }

  ltv: number
  ltvMax: number
  ltvThreshold: number
  activeProvider?: LendingProviderDetails
  providers?: LendingProviderDetails[]
}
