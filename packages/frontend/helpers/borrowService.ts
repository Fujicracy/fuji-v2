import { formatUnits, parseUnits } from "ethers/lib/utils"

import {
  Address,
  BorrowingVault,
  RouterActionParams,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from "@x-fuji/sdk"
import { sdk } from "../services/sdk"

export type RouteMeta = {
  //gasFees: number
  estimateSlippage: number
  bridgeFee: number
  estimateTime: number
  steps: RoutingStepDetails[]
  actions: RouterActionParams[]
  address: string
  recommended: boolean
}

/*
  I'm sure we'll refactor this at some point. Not ideal implementation. 
  Object is, we need to grab the previews for all vaults and not stop in case one crashes,
  plus saving the corresponding address and return everything for the caller to handle.
*/
export const fetchRoutes = async (
  vault: BorrowingVault,
  collateralToken: Token,
  debtToken: Token,
  collateralInput: string,
  debtInput: string,
  address: string,
  recommended: boolean
): Promise<{
  data?: RouteMeta
  error?: Error
}> => {
  const result: {
    data?: RouteMeta
    error?: Error
  } = {}
  try {
    const preview = await sdk.previews.depositAndBorrow(
      vault,
      parseUnits(collateralInput, collateralToken.decimals),
      parseUnits(debtInput, debtToken.decimals),
      collateralToken,
      debtToken,
      new Address(address)
    )
    const { bridgeFee, estimateSlippage, estimateTime, actions, steps } =
      preview

    const bridgeStep = steps.filter((s) => s.step === RoutingStep.X_TRANSFER)[0]
    const _bridgeFee = bridgeStep
      ? formatUnits(bridgeFee, bridgeStep.token?.decimals ?? 18)
      : "0"

    result.data = {
      address: vault.address.value,
      recommended,
      bridgeFee: Number(_bridgeFee),
      // slippage is in basis points
      estimateSlippage: estimateSlippage.toNumber() / 100,
      estimateTime,
      actions,
      steps,
    }
    return result
  } catch (e) {
    if (e instanceof Error) result.error = e
  }
  return result
}
