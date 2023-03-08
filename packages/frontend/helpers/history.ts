import { ChainId, RoutingStep } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import { HistoryRoutingStep } from "../store/history.store"
import { camelize } from "./values"

const stepOutput = (
  step: HistoryRoutingStep | undefined
): string | undefined => {
  if (!step) return undefined
  const stepAction =
    step.step === RoutingStep.DEPOSIT
      ? "deposit"
      : step.step === RoutingStep.BORROW
      ? "borrow"
      : step.step === RoutingStep.PAYBACK
      ? "payback"
      : "withdraw"
  const stepAmount =
    step?.amount && formatUnits(step.amount, step.token.decimals)

  return `${stepAction} ${stepAmount} ${step.token.symbol}}`
}

export const entryOutput = (
  steps: HistoryRoutingStep[]
): {
  title: string
  transactionLink: {
    hash: string
    chainId: ChainId | undefined
  }
} => {
  const step1 =
    steps.find((s) => s.step === RoutingStep.DEPOSIT) ||
    steps.find((s) => s.step === RoutingStep.PAYBACK)

  const step1Output = stepOutput(step1)

  const step2 =
    steps.find((s) => s.step === RoutingStep.BORROW) ||
    steps.find((s) => s.step === RoutingStep.WITHDRAW)
  const step2Output = stepOutput(step2)

  const title = camelize(
    step1Output
      ? step2Output
        ? `${step1Output} and ${step2Output}`
        : `${step1Output}`
      : `${step2Output}`
  )

  const hash = step2?.txHash || step2?.txHash || ""
  const chainId = step2?.chainId || step2?.chainId
  return {
    title,
    transactionLink: {
      hash,
      chainId,
    },
  }
}
