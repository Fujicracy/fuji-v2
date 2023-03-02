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
  balance: number
  ltvMeta: LtvMeta
  metaStatus: FetchStatus
  isSigning: boolean
  isExecuting: boolean
  availableVaultStatus: FetchStatus
  mode: Mode
  managePosition: boolean
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
  balance,
  ltvMeta,
  metaStatus,
  isSigning,
  isExecuting,
  availableVaultStatus,
  mode,
  managePosition,
  hasBalanceInVault,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onRedirectClick,
  onClick,
}: BorrowButtonProps) {
  const collateralAmount = parseFloat(collateral.input)
  const debtAmount = parseFloat(debt.input)

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
  } else if (!managePosition && hasBalanceInVault) {
    return regularButton("Manage position", () => {
      onRedirectClick(false)
    })
  } else if (managePosition && !hasBalanceInVault) {
    return regularButton("Borrow", () => {
      onRedirectClick(true)
    })
  } else if (debtAmount !== 0 && debtAmount <= MINIMUM_DEBT_AMOUNT) {
    return disabledButton("Borrowing amount too low") // TODO: Temp text
  } else if (collateralAmount > 0 && collateralAmount > balance) {
    // && Mode...?
    return disabledButton(`Insufficient ${collateral.token.symbol} balance`)
  } else if (ltvMeta.ltv > ltvMeta.ltvMax) {
    return disabledButton("Not enough collateral")
  } else if (
    (mode === Mode.WITHDRAW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    collateralAmount > position.collateral.amount
  ) {
    return disabledButton("Too much collateral?") // TODO: Temp text
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > position.debt.amount
  ) {
    return disabledButton("Too much debt?") // TODO: Temp text
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
        startIcon={<></>}
        disabled={
          collateralAmount <= 0 || debtAmount <= 0 || metaStatus !== "ready"
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
