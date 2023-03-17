import { BorrowingVault, VaultWithFinancials, Token } from "@x-fuji/sdk"
import { NextRouter } from "next/router"
import { chainName } from "./chains"
import { sdk } from "../services/sdk"
import { useBorrow } from "../store/borrow.store"
import { usePositions } from "../store/positions.store"

enum TopLevelUrl {
  Markets = "/markets",
  Borrow = "/borrow",
  Lending = "/lend",
  MyPositions = "/my-positions",
}

export const PageUrl = {
  ...TopLevelUrl,
  Position: "/my-positions/[pid]",
}

export const isTopLevelUrl = (url: string) =>
  (Object.values(TopLevelUrl) as string[]).includes(url)

export const showPosition = async (
  router: NextRouter,
  walletChainId: string | undefined,
  entity?: BorrowingVault | VaultWithFinancials,
  reset = true
) => {
  const vault = entity instanceof BorrowingVault ? entity : entity?.vault
  if (!vault) return

  const changeAll = useBorrow.getState().changeAll
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

  if (reset) {
    useBorrow.getState().changeInputValues("", "")
  }

  const positions = usePositions.getState().positions
  if (positions?.find((p) => p.vault?.address.value === vault.address.value)) {
    router.push(`/my-positions/${vault.address.value}-${vault.chainId}`)
  } else {
    router.push(`/borrow`)
  }
}
