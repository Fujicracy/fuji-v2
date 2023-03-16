import { Button } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import { ConnectedChain } from "@web3-onboard/core"
import { FetchStatus } from "../../store/borrow.store"
import {
  AssetChange,
  LtvMeta,
  Mode,
  ActionType,
  AssetType,
  needsAllowance,
} from "../../helpers/assets"
import { Position } from "../../store/models/Position"
import { MINIMUM_DEBT_AMOUNT } from "../../constants/borrow"
import { chainIdToHex } from "../../helpers/chains"

type BorrowButtonProps = {
  address: string | undefined
  collateral: AssetChange
  debt: AssetChange
  position: Position
  walletChain: ConnectedChain | undefined
  ltvMeta: LtvMeta
  metaStatus: FetchStatus
  needsPermit: boolean
  isSigning: boolean
  isExecuting: boolean
  availableVaultStatus: FetchStatus
  mode: Mode
  isEditing: boolean
  actionType: ActionType
  hasBalanceInVault: boolean
  onLoginClick: () => void
  onChainChangeClick: (chainId: string) => void
  onApproveClick: (type: AssetType) => void
  onRedirectClick: (position: boolean) => void
  onClick: () => void
  ltvCheck: (action: () => void) => void
}

function BorrowButton({
  address,
  collateral,
  debt,
  position,
  walletChain,
  ltvMeta,
  metaStatus,
  needsPermit,
  isSigning,
  isExecuting,
  availableVaultStatus,
  mode,
  isEditing,
  actionType,
  hasBalanceInVault,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onRedirectClick,
  onClick,
  ltvCheck,
}: BorrowButtonProps) {
  const collateralAmount = parseFloat(collateral.input)
  const debtAmount = parseFloat(debt.input)
  const collateralBalance = collateral.balances[collateral.token.symbol]
  const debtBalance = debt.balances[debt.token.symbol]

  const executionStep = needsPermit ? 2 : 1
  const actionTitle = `${needsPermit ? "Sign & " : ""}${
    mode === Mode.DEPOSIT_AND_BORROW
      ? `${needsPermit ? "" : "Deposit & "}Borrow`
      : mode === Mode.BORROW
      ? "Borrow"
      : mode === Mode.DEPOSIT
      ? "Deposit"
      : mode === Mode.PAYBACK_AND_WITHDRAW
      ? "Repay & Withdraw"
      : mode === Mode.WITHDRAW
      ? "Withdraw"
      : "Repay"
  }`

  const loadingButtonTitle =
    (isSigning && "(1/2) Signing...") ||
    (isExecuting &&
      `(${executionStep}/${executionStep}) ${
        mode === Mode.DEPOSIT_AND_BORROW || mode === Mode.BORROW
          ? "Borrowing"
          : mode === Mode.DEPOSIT
          ? "Depositing"
          : mode === Mode.PAYBACK_AND_WITHDRAW || mode === Mode.WITHDRAW
          ? "Withdrawing"
          : "Repaying"
      }...`) ||
    actionTitle

  const regularButton = (
    title: string,
    action: () => void,
    data: string | undefined = undefined
  ) => {
    return (
      <Button
        variant="gradient"
        size="large"
        fullWidth
        onClick={() => clickWithLTVCheck(action)}
        data-cy={data}
      >
        {title}
      </Button>
    )
  }

  const clickWithLTVCheck: (action: () => void) => void = (action) => {
    ltvCheck(action)
  }

  const disabledButton = (title: string) => (
    <Button variant="gradient" size="large" fullWidth disabled>
      {title}
    </Button>
  )

  if (!address) {
    return regularButton("Connect wallet", onLoginClick, "borrow-login")
  } else if (
    collateral.chainId !== debt.chainId &&
    debt.token.symbol === "DAI"
  ) {
    return disabledButton("Cross-chain DAI not supported")
  } else if (
    (actionType === ActionType.ADD ? collateral.chainId : debt.chainId) !==
    walletChain?.id
  ) {
    return regularButton("Switch network", () => {
      onChainChangeClick(
        actionType === ActionType.ADD ? collateral.chainId : debt.chainId
      )
    })
  } else if (!isEditing && hasBalanceInVault) {
    return regularButton("Manage position", () => {
      onRedirectClick(false)
    })
  } else if (isEditing && !hasBalanceInVault) {
    return regularButton("Borrow", () => {
      onRedirectClick(true)
    })
  } else if (collateralAmount > 0 && collateralAmount > collateralBalance) {
    return disabledButton(`Insufficient ${collateral.token.symbol} balance`)
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > debtBalance
  ) {
    return disabledButton(`Insufficient ${debt.token.symbol} balance`)
  } else if (ltvMeta.ltv > ltvMeta.ltvMax) {
    return disabledButton("Not enough collateral")
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > position.debt.amount
  ) {
    return disabledButton("Payback more than amount due")
  } else if (
    mode === Mode.DEPOSIT_AND_BORROW &&
    debtAmount !== 0 &&
    debtAmount <= MINIMUM_DEBT_AMOUNT
  ) {
    return disabledButton("Need to borrow at least 1 USD")
  } else if (
    (mode === Mode.WITHDRAW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    collateralAmount > position.collateral.amount
  ) {
    return disabledButton("Withdraw more than allowed")
  } else if (needsAllowance(mode, "collateral", collateral, collateralAmount)) {
    return regularButton("Allow", () => {
      onApproveClick("collateral")
    })
  } else if (needsAllowance(mode, "debt", debt, debtAmount)) {
    return regularButton("Allow", () => {
      onApproveClick("debt")
    })
  } else if (
    isEditing &&
    position.vault &&
    mode === Mode.DEPOSIT_AND_BORROW &&
    debt.chainId !== chainIdToHex(position.vault?.chainId)
  ) {
    return disabledButton("wtf?")
  } else {
    return (
      <LoadingButton
        variant="gradient"
        size="large"
        loadingPosition="start"
        fullWidth
        disabled={
          !(
            (metaStatus === "ready" &&
              (mode === Mode.DEPOSIT_AND_BORROW ||
                mode === Mode.PAYBACK_AND_WITHDRAW) &&
              collateralAmount > 0 &&
              debtAmount > 0) ||
            ((mode === Mode.DEPOSIT || mode === Mode.WITHDRAW) &&
              collateralAmount > 0) ||
            ((mode === Mode.BORROW || mode === Mode.PAYBACK) && debtAmount > 0)
          )
        }
        loading={
          isSigning || isExecuting || availableVaultStatus === "fetching"
        }
        onClick={() => clickWithLTVCheck(onClick)}
      >
        {loadingButtonTitle}
      </LoadingButton>
    )
  }
}

export default BorrowButton
