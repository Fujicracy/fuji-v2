import { Button } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import { ConnectedChain } from "@web3-onboard/core"
import { Token } from "@x-fuji/sdk"
import { FetchStatus } from "../../store/borrow.store"
import { Mode } from "../../helpers/borrow"

type BorrowButtonProps = {
  address: string | undefined
  collateralChainId: string
  walletChain: ConnectedChain | undefined
  collateralAmount: number
  debtAmount: number
  balance: number
  ltv: number
  ltvMax: number
  collateralAllowance: number | undefined
  collateralToken: Token
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

const BorrowButton = (props: BorrowButtonProps) => {
  const loadingButtonTitle =
    (props.isSigning && "(1/2) Signing...") ||
    (props.isExecuting &&
      `(2/2) ${
        props.mode === Mode.DEPOSIT_AND_BORROW || props.mode === Mode.BORROW
          ? "Borrowing"
          : props.mode === Mode.DEPOSIT
          ? "Depositing"
          : props.mode === Mode.PAYBACK_AND_WITHDRAW ||
            props.mode === Mode.WITHDRAW
          ? "Withdrawing"
          : "Repaying"
      }...`) ||
    props.mode === Mode.DEPOSIT_AND_BORROW
      ? "Sign & Borrow"
      : props.mode === Mode.BORROW
      ? "Borrow"
      : props.mode === Mode.DEPOSIT
      ? "Deposit"
      : props.mode === Mode.PAYBACK_AND_WITHDRAW
      ? "Repay & Withdraw"
      : props.mode === Mode.WITHDRAW
      ? "Withdraw"
      : "Repay"

  if (!props.address) {
    return (
      <Button
        variant="gradient"
        size="large"
        onClick={() => props.onLoginClick()}
        fullWidth
        data-cy="borrow-login"
      >
        Connect wallet
      </Button>
    )
  } else if (props.collateralChainId !== props.walletChain?.id) {
    return (
      <Button
        variant="gradient"
        size="large"
        fullWidth
        onClick={() => props.onChainChangeClick()}
      >
        Switch network
      </Button>
    )
  } else if (
    props.collateralAmount > 0 &&
    props.collateralAmount > props.balance
  ) {
    return (
      <Button variant="gradient" size="large" disabled fullWidth>
        Insufficient {props.collateralToken.symbol} balance
      </Button>
    )
  } else if (props.ltv > props.ltvMax) {
    return (
      <Button variant="gradient" size="large" disabled fullWidth>
        Not enough collateral
      </Button>
    )
  } else if (
    props.collateralAllowance !== undefined &&
    props.collateralAllowance < props.collateralAmount
  ) {
    return (
      <Button
        variant="gradient"
        fullWidth
        size="large"
        onClick={() => props.onApproveClick()}
      >
        Allow
      </Button>
    )
  } else if (!props.managePosition && props.hasBalance) {
    return (
      <Button
        variant="gradient"
        fullWidth
        size="large"
        onClick={() => props.onPositionClick()}
      >
        Manage position
      </Button>
    )
  } else {
    return (
      <LoadingButton
        variant="gradient"
        onClick={() => props.onClick()}
        size="large"
        fullWidth
        disabled={
          props.collateralAmount <= 0 ||
          props.debtAmount <= 0 ||
          props.metaStatus !== "ready"
        }
        loading={
          props.isSigning ||
          props.isExecuting ||
          props.availableVaultStatus === "fetching"
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
