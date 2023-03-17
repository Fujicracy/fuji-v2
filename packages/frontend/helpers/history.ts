import { ChainId, RoutingStep, RoutingStepDetails } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import { HistoryEntry, HistoryRoutingStep } from "../store/history.store"
import { camelize } from "./values"

export const entryOutput = (
  step: RoutingStepDetails,
  hash: string
): {
  title: string
  transactionUrl: {
    hash: string
    chainId: ChainId
  }
} => {
  const stepAction = camelize(step.step.toString())
  const stepAmount =
    step.amount && formatUnits(step.amount, step.token?.decimals)
  const title = `${stepAction} ${stepAmount} ${step.token?.symbol}}`
  const chainId = step.chainId

  return {
    title,
    transactionUrl: {
      hash,
      chainId,
    },
  }
}

export const stepFromEntry = (
  entry: HistoryEntry,
  type: RoutingStep
): HistoryRoutingStep | undefined => {
  return entry.steps.find((s) => s.step === type)
}
