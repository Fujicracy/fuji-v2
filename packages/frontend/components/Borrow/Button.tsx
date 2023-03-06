import { Button } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import { ConnectedChain } from "@web3-onboard/core"
import { FetchStatus } from "../../store/borrow.store"
import { AssetChange, LtvMeta, Mode } from "../../helpers/borrow"
import { MINIMUM_DEBT_AMOUNT } from "../../constants/borrow"
import { Position } from "../../store/models/Position"

type BorrowButtonProps = {
  address: string | undefined
  collateral: AssetChange
  debt: AssetChange
  position: Position
  walletChain: ConnectedChain | undefined
  ltvMeta: LtvMeta
  metaStatus: FetchStatus
  isSigning: boolean
  isExecuting: boolean
  availableVaultStatus: FetchStatus
  mode: Mode
  isManagingPosition: boolean
  hasBalanceInVault: boolean
  onLoginClick: () => void
  onChainChangeClick: () => void
  onApproveClick: () => void
  onRedirectClick: (position: boolean) => void
  onClick: () => void
}

function BorrowButton({
  address,
  collateral,
  debt,
  position,
  walletChain,
  ltvMeta,
  metaStatus,
  isSigning,
  isExecuting,
  availableVaultStatus,
  mode,
  isManagingPosition,
  hasBalanceInVault,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onRedirectClick,
  onClick,
}: BorrowButtonProps) {
  const collateralAmount = parseFloat(collateral.input)
  const debtAmount = parseFloat(debt.input)
  const collateralBalance = collateral.balances[collateral.token.symbol]
  const debtBalance = debt.balances[debt.token.symbol]

  const loadingButtonTitle =
    (isSigning && "(1/2) Signing...") ||
    (isExecuting &&
      `(2/2) ${
        mode === Mode.DEPOSIT_AND_BORROW || mode === Mode.BORROW
          ? "Borrowing"
          : mode === Mode.DEPOSIT
          ? "Depositing"
          : mode === Mode.PAYBACK_AND_WITHDRAW || mode === Mode.WITHDRAW
          ? "Withdrawing"
          : "Repaying"
      }...`) ||
    mode === Mode.DEPOSIT_AND_BORROW
      ? "Sign & Borrow"
      : mode === Mode.BORROW
      ? "Borrow"
      : mode === Mode.DEPOSIT
      ? "Deposit"
      : mode === Mode.PAYBACK_AND_WITHDRAW
      ? "Repay & Withdraw"
      : mode === Mode.WITHDRAW
      ? "Withdraw"
      : "Repay"

  const regularButton = (
    title: string,
    onClick: () => void,
    data: string | undefined = undefined
  ) => (
    <Button
      variant="gradient"
      size="large"
      fullWidth
      onClick={onClick}
      data-cy={data}
    >
      {title}
    </Button>
  )

  const disabledButton = (title: string) => (
    <Button variant="gradient" size="large" fullWidth disabled>
      {title}
    </Button>
  )

  if (!address) {
    return regularButton("Connect wallet", onLoginClick, "borrow-login")
  } else if (collateral.chainId !== walletChain?.id) {
    return regularButton("Switch network", onChainChangeClick)
  } else if (!isManagingPosition && hasBalanceInVault) {
    return regularButton("Manage position", () => {
      onRedirectClick(false)
    })
  } else if (isManagingPosition && !hasBalanceInVault) {
    return regularButton("Borrow", () => {
      onRedirectClick(true)
    })
  } else if (debtAmount !== 0 && debtAmount <= MINIMUM_DEBT_AMOUNT) {
    return disabledButton("Debt amount too low") // TODO: Temp text
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
    return disabledButton("Too much debt?") // TODO: Temp text
  } else if (
    (mode === Mode.WITHDRAW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    collateralAmount > position.collateral.amount
  ) {
    return disabledButton("Too much collateral?") // TODO: Temp text
  } else if (
    collateral.allowance?.value !== undefined &&
    collateral.allowance?.value < collateralAmount
  ) {
    return regularButton("Allow", onApproveClick)
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
        onClick={onClick}
      >
        {loadingButtonTitle}
      </LoadingButton>
    )
  }
}

export default BorrowButton
