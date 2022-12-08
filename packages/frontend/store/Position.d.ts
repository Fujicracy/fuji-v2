import { BorrowingVault, LendingProviderDetails, Token } from "@x-fuji/sdk"

// reprensent an open position on fuji
export class Position {
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

  liquidationPrice: number
  liquidationDiff: number

  activeProvider?: LendingProviderDetails
  providers?: LendingProviderDetails[]
}
