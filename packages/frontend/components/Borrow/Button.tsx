import { Button } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import { ConnectedChain } from "@web3-onboard/core"
import { PositionTypeMeta } from "../../store/models/Position"
import { FetchStatus } from "../../store/borrow.store"

export type BorrowButtonActions =
  | "login"
  | "change_chain"
  | "approve"
  | "execute"

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
  collateral: PositionTypeMeta
  metaStatus: FetchStatus
  isSigning: boolean
  isBorrowing: boolean
  availableVaultStatus: FetchStatus
  onClick: (action: BorrowButtonActions) => void
}

const BorrowButton = (props: BorrowButtonProps) => {
  if (!props.address) {
    return (
      <Button
        variant="gradient"
        size="large"
        onClick={() => props.onClick("login")}
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
        onClick={() => props.onClick("change_chain")}
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
        Insufficient {props.collateral.token.symbol} balance
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
    props.collateralAllowance < props.collateral.amount
  ) {
    return (
      <Button
        variant="gradient"
        fullWidth
        size="large"
        onClick={() => props.onClick("approve")}
      >
        Allow
      </Button>
    )
  } else {
    return (
      <LoadingButton
        variant="gradient"
        onClick={() => props.onClick("execute")}
        size="large"
        fullWidth
        disabled={
          props.collateralAmount <= 0 ||
          props.debtAmount <= 0 ||
          props.metaStatus !== "ready"
        }
        loading={
          props.isSigning ||
          props.isBorrowing ||
          props.availableVaultStatus === "fetching"
        }
        loadingPosition="start"
        startIcon={<></>}
      >
        {(props.isSigning && "(1/2) Signing...") ||
          (props.isBorrowing && "(2/2) Borrowing...") ||
          "Sign & Borrow"}
      </LoadingButton>
    )
  }
}

export default BorrowButton
