import { Address } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import { sdk } from "../services/sdk"
import { onboard, useAuth } from "../store/auth.store"
import { useBorrow } from "../store/borrow.store"

// TODO:
// - Call this each X seconds
// - Allow cancelation

async function checkBalances(addr: string | undefined) {
  if (!addr) {
    return
  }

  const address = Address.from(addr)
  const debt = useBorrow.getState().debt
  const collateral = useBorrow.getState().collateral

  const data = [collateral, debt]

  for (const d of data) {
    const rawBalances = await sdk.getTokenBalancesFor(
      d.selectableTokens,
      address,
      d.token.chainId
    )
    const balances: Record<string, number> = {}
    rawBalances.forEach((b, i) => {
      const value = parseFloat(formatUnits(b, d.selectableTokens[i].decimals))
      balances[d.selectableTokens[i].symbol] = value
    })
    console.log(rawBalances)
    // TODO:
    // - Check if no operations are being made
    // - Check if stored balances are different
    // - If so, update the balances
    // - Move above code into a reusable function, otherwise it would be duplicated
  }

  // At the moment, native token is treated differently.
  // (We don't do anything with it but show it at the top)
  // So this is enough to trigger an update/re-render
  onboard.state.actions.updateBalances([addr])
}
