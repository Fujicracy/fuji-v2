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
import { LTV_RECOMMENDED_DECREASE } from "../constants/borrow"

export type AssetChange = {
  selectableTokens: Token[]
  balances: Record<string, number>
  allowance: {
    status: "initial" | "fetching" | "allowing" | "ready" | "error"
    value: number | undefined
  }
  input: string
  chainId: string
  token: Token
  amount: number
  usdPrice: number
}

export type LtvMeta = {
  ltv: number
  ltvMax: number
  ltvThreshold: number
}

export type LiquidationMeta = {
  liquidationPrice: number
  liquidationDiff: number
}

export enum PositionAction {
  ADD = 0,
  REMOVE = 1,
}

export enum Mode {
  DEPOSIT_AND_BORROW, // addPosition: both collateral and debt
  PAYBACK_AND_WITHDRAW, // removePosition: both collateral and debt
  DEPOSIT, // addPosition: collateral
  BORROW, //addPosition: debt
  WITHDRAW, // removePosition: collateral
  REPAY, // removePosition: debt
}

export function modeForContext(
  managing: boolean,
  action: PositionAction,
  collateral: number,
  debt: number
): Mode {
  if (!managing) return Mode.DEPOSIT_AND_BORROW
  if ((collateral > 0 && debt > 0) || (collateral === 0 && debt === 0)) {
    return PositionAction.ADD === action
      ? Mode.DEPOSIT_AND_BORROW
      : Mode.PAYBACK_AND_WITHDRAW
  } else if (collateral > 0) {
    return PositionAction.ADD === action ? Mode.DEPOSIT : Mode.WITHDRAW
  } else if (debt > 0) {
    return PositionAction.ADD === action ? Mode.BORROW : Mode.REPAY
  }
  return Mode.DEPOSIT_AND_BORROW
}

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
      case Mode.DEPOSIT:
        preview = await sdk.previews.deposit(
          vault,
          parseUnits(collateralInput, collateralToken.decimals),
          collateralToken,
          Address.from(address)
        )
      case Mode.BORROW:
        preview = await sdk.previews.borrow(
          vault,
          collateralToken.chainId,
          parseUnits(debtInput, debtToken.decimals),
          debtToken,
          Address.from(address)
        )
      case Mode.PAYBACK_AND_WITHDRAW:
        preview = await sdk.previews.paybackAndWithdraw(
          vault,
          parseUnits(collateralInput, collateralToken.decimals),
          parseUnits(debtInput, debtToken.decimals),
          collateralToken,
          debtToken,
          Address.from(address)
        )
      case Mode.WITHDRAW:
        preview = await sdk.previews.withdraw(
          vault,
          collateralToken.chainId, // TODO: wallet chain id
          parseUnits(collateralInput, collateralToken.decimals),
          collateralToken,
          Address.from(address)
        )
      case Mode.REPAY:
        preview = await sdk.previews.payback(
          vault,
          parseUnits(debtInput, debtToken.decimals),
          debtToken,
          Address.from(address)
        )
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

export const recommendedLTV = (ltvMax: number): number => {
  return ltvMax > 20 ? ltvMax - LTV_RECOMMENDED_DECREASE : 0
}
