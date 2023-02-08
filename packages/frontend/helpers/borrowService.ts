import { parseUnits } from "ethers/lib/utils"

import {
  Address,
  BorrowingVault,
  RouterActionParams,
  RoutingStepDetails,
  Token,
} from "@x-fuji/sdk"
import { sdk } from "../services/sdk"
import { PositionMeta } from "../store/models/Position"

export type RouteMeta = {
  bridgeFee: number
  estimateTime: number
  actions: RouterActionParams[]
  steps: RoutingStepDetails[]
  address: string
}

export const fetchRoutes = async (
  vault: BorrowingVault,
  collateralToken: Token,
  debtToken: Token,
  collateralInput: string,
  debtInput: string,
  address: string
): Promise<{
  address: string
  data: RouteMeta
  error: Error
}> => {
  const aaa: any = {}
  aaa.address = vault.address.value
  try {
    const a = await sdk.previews.depositAndBorrow(
      vault,
      parseUnits(collateralInput, collateralToken.decimals),
      parseUnits(debtInput, debtToken.decimals),
      collateralToken,
      debtToken,
      new Address(address)
    )
    const { bridgeFee, estimateTime, actions, steps } = a

    aaa.data = {
      bridgeFee: bridgeFee.toNumber(),
      estimateTime,
      actions,
      steps,
    }
    return aaa
  } catch (e) {
    aaa.error = e
    console.log(e)
  }
  return aaa
}
