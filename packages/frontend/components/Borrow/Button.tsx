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

  if (!address) {
    return (
      <Button
        variant="gradient"
        size="large"
        onClick={() => onLoginClick()}
        fullWidth
        data-cy="borrow-login"
      >
        Connect wallet
      </Button>
    )
  } else if (collateral.chainId !== walletChain?.id) {
    return (
      <Button
        variant="gradient"
        size="large"
        fullWidth
        onClick={() => onChainChangeClick()}
      >
        Switch network
      </Button>
    )
  } else if (!managePosition && hasBalance) {
    return (
      <Button
        variant="gradient"
        fullWidth
        size="large"
        onClick={() => onPositionClick()}
      >
        Manage position
      </Button>
    )
  } else if (debtAmount !== 0 && debtAmount <= MINIMUM_DEBT_AMOUNT) {
    return (
      <Button variant="gradient" size="large" disabled fullWidth>
        {
          // TODO: need to figure this one out
        }
        {"Borrowing amount too low"}
      </Button>
    )
  } else if (collateralAmount > 0 && collateralAmount > balance) {
    return (
      <Button variant="gradient" size="large" disabled fullWidth>
        Insufficient {collateral.token.symbol} balance
      </Button>
    )
  } else if (ltvMeta.ltv > ltvMeta.ltvMax) {
    return (
      <Button variant="gradient" size="large" disabled fullWidth>
        Not enough collateral
      </Button>
    )
  } else if (
    collateral.allowance?.value !== undefined &&
    collateral.allowance?.value < collateralAmount
  ) {
    return (
      <Button
        variant="gradient"
        fullWidth
        size="large"
        onClick={() => onApproveClick()}
      >
        Allow
      </Button>
    )
  } else {
    return (
      <LoadingButton
        variant="gradient"
        onClick={() => onClick()}
        size="large"
        fullWidth
        disabled={
          collateralAmount <= 0 || debtAmount <= 0 || metaStatus !== "ready"
        }
        loading={
          isSigning || isExecuting || availableVaultStatus === "fetching"
        }
        loadingPosition="start"
        startIcon={<></>}
      >
        {loadingButtonTitle}
      </LoadingButton>
    )
  }
}

export default BorrowButton
