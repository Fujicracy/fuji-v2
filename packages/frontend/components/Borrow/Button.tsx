import { Button } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import { ConnectedChain } from "@web3-onboard/core"
import { FetchStatus } from "../../store/borrow.store"
import { AssetChange, LtvMeta, Mode } from "../../helpers/borrow"
import { MINIMUM_DEBT_AMOUNT } from "../../constants/borrow"

type BorrowButtonProps = {
  address: string | undefined
  collateral: AssetChange
  walletChain: ConnectedChain | undefined
  collateralAmount: number
  debtAmount: number
  balance: number
  ltvMeta: LtvMeta
  metaStatus: FetchStatus
  isSigning: boolean
  isExecuting: boolean
  availableVaultStatus: FetchStatus
  mode: Mode
  managePosition: boolean
  hasBalance: boolean
  onLoginClick: () => void
  onChainChangeClick: () => void
  onApproveClick: () => void
  onPositionClick: () => void
  onClick: () => void
}

function BorrowButton({
  address,
  collateral,
  walletChain,
  collateralAmount,
  debtAmount,
  balance,
  ltvMeta,
  metaStatus,
  isSigning,
  isExecuting,
  availableVaultStatus,
  mode,
  managePosition,
  hasBalance,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onPositionClick,
  onClick,
}: BorrowButtonProps) {
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
  } else if (!managePosition && hasBalance) {
    return regularButton("Manage position", onPositionClick)
  } else if (debtAmount !== 0 && debtAmount <= MINIMUM_DEBT_AMOUNT) {
    return disabledButton("Borrowing amount too low") // TODO: need to figure this one out
  } else if (collateralAmount > 0 && collateralAmount > balance) {
    return disabledButton(`Insufficient ${collateral.token.symbol} balance`)
  } else if (ltvMeta.ltv > ltvMeta.ltvMax) {
    return disabledButton("Not enough collateral")
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
