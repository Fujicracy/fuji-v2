import { BorrowingVault, VaultWithFinancials, Token } from "@x-fuji/sdk"
import { NextRouter } from "next/router"
import { chainName } from "../services/chains"
import { sdk } from "../services/sdk"
import { Position } from "../store/models/Position"

enum TopLevelUrl {
  Markets = "/markets",
  Borrow = "/borrow",
  Lending = "/lend",
  MyPositions = "/my-positions",
}

export const isTopLevelUrl = (url: string) =>
  (Object.values(TopLevelUrl) as string[]).includes(url)

export const navigateToVault = async (
  router: NextRouter,
  walletChainId: string | undefined,
  positions: Position[] | boolean | undefined,
  changeAll:
    | ((collateral: Token, debt: Token, vault: BorrowingVault) => void)
    | undefined,
  entity?: BorrowingVault | VaultWithFinancials
) => {
  const vault = entity instanceof BorrowingVault ? entity : entity?.vault
  if (!vault) return

  if (changeAll) {
    const isSupported = chainName(walletChainId) !== ""
    if (isSupported) {
      const collaterals = sdk.getCollateralForChain(Number(walletChainId))
      const collateralToken = collaterals.find(
        (t: Token) => t.symbol === vault.collateral.symbol
      )
      changeAll(collateralToken ?? vault.collateral, vault.debt, vault)
    } else {
      changeAll(vault.collateral, vault.debt, vault)
    }
  }

  if (
    positions === true ||
    (Array.isArray(positions) &&
      positions?.find((p) => p.vault?.address.value === vault.address.value))
  ) {
    router.push(`/my-positions/${vault.address.value}-${vault.chainId}`)
  } else {
    router.push("/borrow")
  }
}
