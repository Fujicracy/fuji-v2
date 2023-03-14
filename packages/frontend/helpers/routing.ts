import {
  Address,
  BorrowingVault,
  RouterActionParams,
  RoutingStep,
  RoutingStepDetails,
  PreviewResult,
  Token,
} from "@x-fuji/sdk"
import { sdk } from "../services/sdk"
import { formatUnits, parseUnits } from "ethers/lib/utils"
import { Mode } from "./assets"
import { camelize } from "./values"

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

export const stringifyStep = (step: RoutingStep): string =>
  camelize(step.toString())

export const fetchRoutes = async (
  mode: Mode,
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
    let preview: PreviewResult
    switch (mode) {
      case Mode.DEPOSIT_AND_BORROW:
        preview = await sdk.previews.depositAndBorrow(
          vault,
          parseUnits(collateralInput, collateralToken.decimals),
          parseUnits(debtInput, debtToken.decimals),
          collateralToken,
          debtToken,
          Address.from(address)
        )
        break
      case Mode.DEPOSIT:
        preview = await sdk.previews.deposit(
          vault,
          parseUnits(collateralInput, collateralToken.decimals),
          collateralToken,
          Address.from(address)
        )
        break
      case Mode.BORROW:
        preview = await sdk.previews.borrow(
          vault,
          collateralToken.chainId,
          parseUnits(debtInput, debtToken.decimals),
          debtToken,
          Address.from(address)
        )
        break
      case Mode.PAYBACK_AND_WITHDRAW:
        preview = await sdk.previews.paybackAndWithdraw(
          vault,
          parseUnits(collateralInput, collateralToken.decimals),
          parseUnits(debtInput, debtToken.decimals),
          collateralToken,
          debtToken,
          Address.from(address)
        )
        break
      case Mode.WITHDRAW:
        preview = await sdk.previews.withdraw(
          vault,
          collateralToken.chainId, // TODO: wallet chain id
          parseUnits(collateralInput, collateralToken.decimals),
          collateralToken,
          Address.from(address)
        )
        break
      case Mode.PAYBACK:
        preview = await sdk.previews.payback(
          vault,
          parseUnits(debtInput, debtToken.decimals),
          debtToken,
          Address.from(address)
        )
        break
    }
    const { bridgeFee, estimateSlippage, estimateTime, actions, steps } =
      preview

    const bridgeStep = steps.find((s) => s.step === RoutingStep.X_TRANSFER)
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
