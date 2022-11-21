import { ReactNode, useEffect, useState } from "react"
import {
  Divider,
  Button,
  Typography,
  CardContent,
  Card,
  Grid,
} from "@mui/material"
import Image from "next/image"

import { useStore } from "../../store"
import styles from "../../styles/components/Borrow.module.css"
import TransactionProcessingModal from "./TransactionProcessingModal"
import { ChainSelect } from "./ChainSelect"
import TokenCard from "./TokenCard"
import { useLtv } from "../../store/transaction.slice"
import { Fees } from "./Fees"
import ApprovalModal from "./ApprovalModal"
import LoadingButton from "@mui/lab/LoadingButton"

export default function Borrow() {
  const address = useStore((state) => state.address)
  const walletChain = useStore((state) => state.chain)
  const changeChain = useStore((state) => state.changeChain)
  const updateBalance = useStore((state) => state.updateBalances)
  const updateVault = useStore((state) => state.updateVault)
  const updateAllowance = useStore((state) => state.updateAllowance)
  useEffect(() => {
    if (address) {
      updateBalance("collateral")
      updateAllowance()
      updateVault()
    }
  }, [address, updateBalance])

  const login = useStore((state) => state.login)

  const collateral = useStore((state) => state.position.collateral)
  const collateralChainId = useStore((state) => state.collateralChainId)
  const collateralAllowance = useStore((state) => state.collateralAllowance)
  const debt = useStore((state) => state.position.debt)
  const debtChainId = useStore((state) => state.debtChainId)
  const changeBorrowChain = useStore((state) => state.changeBorrowChain)
  const changeCollateralChain = useStore((state) => state.changeCollateralChain)
  // const debt = useStore((state) => state.position.debt)

  const setShowTransactionAbstract = useStore(
    (state) => state.setShowTransactionAbstract
  )

  const [showTransactionProcessingModal, setShowTransactionProcessingModal] =
    useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  // TODO: refacto with a "status" ?

  const value = useStore((state) => parseFloat(state.collateralInput))
  const balance = useStore(
    (state) => state.collateralBalances[state.position.collateral.token.symbol]
  )

  const updateTokenPrice = useStore((state) => state.updateTokenPrice)
  useEffect(() => {
    updateTokenPrice("collateral")
    updateTokenPrice("debt")
  }, [updateTokenPrice])

  const ltv = useLtv()
  const ltvMax = useStore((state) => state.position.ltvMax)

  const signature = useStore((state) => state.signature)
  const isSigning = useStore((state) => state.isSigning)
  const signPermit = useStore((state) => state.signPermit)
  const borrow = useStore((state) => state.borrow)
  const isBorrowing = useStore((state) => state.isBorrowing)

  let button: ReactNode
  if (!address) {
    button = (
      <Button
        variant="gradient"
        onClick={() => login()}
        fullWidth
        data-cy="borrow-login"
      >
        Connect wallet
      </Button>
    )
  } else if (collateralChainId !== walletChain?.id) {
    button = (
      <Button
        variant="gradient"
        fullWidth
        onClick={() => changeChain(collateral.token.chainId)}
      >
        Switch network
      </Button>
    )
  } else if (value > 0 && value > balance) {
    button = (
      <Button variant="gradient" disabled fullWidth>
        Insufficient {collateral.token.symbol} balance
      </Button>
    )
  } else if (ltv > ltvMax) {
    button = (
      <Button variant="gradient" disabled fullWidth>
        Not enough collateral
      </Button>
    )
  } else if (
    collateralAllowance?.value !== undefined &&
    collateralAllowance.value < collateral.amount
  ) {
    button = (
      <Button
        variant="gradient"
        fullWidth
        onClick={() => setShowApprovalModal(true)}
      >
        Allow
      </Button>
    )
  } else {
    button = (
      <>
        <LoadingButton
          variant="primary"
          disabled={
            collateral.amount <= 0 || debt.amount <= 0 || Boolean(signature)
          }
          loading={isSigning}
          onClick={signPermit}
          fullWidth
        >
          {signature ? "Signed" : "Sign"}
        </LoadingButton>

        <br />
        <br />

        <LoadingButton
          variant="gradient"
          onClick={borrow}
          fullWidth
          className={styles.btn}
          disabled={collateral.amount <= 0 || debt.amount <= 0 || !signature}
          loading={isBorrowing}
        >
          Borrow
        </LoadingButton>
      </>
    )
  }

  return (
    <>
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: "0.5rem 0",
        }}
      >
        <CardContent>
          <Typography variant="body2">Borrow</Typography>

          <Divider sx={{ mt: "1rem", mb: "0.5rem" }} />

          <ChainSelect
            label="Collateral from"
            type="collateral"
            value={collateralChainId}
            onChange={(chainId) => changeCollateralChain(chainId)}
          />
          <TokenCard type="collateral" />

          <br />

          <ChainSelect
            label="Borrow to"
            type="borrow"
            value={debtChainId}
            onChange={(chainId) => changeBorrowChain(chainId)}
          />
          <TokenCard type="debt" />

          <br />

          <Fees />
          <br />

          {button}

          <br />
          <br />

          <a
            href="https://www.connext.network/"
            target="_blank"
            rel="noreferrer"
          >
            <Grid container justifyContent="center" alignItems="center">
              <Typography variant="small">Powered by</Typography>
              <Image
                src="/assets/images/logo/connext-title.svg"
                height={16}
                width={95}
                alt="Connext logo"
              />
            </Grid>
          </a>
        </CardContent>
      </Card>
      <TransactionProcessingModal
        open={showTransactionProcessingModal}
        handleClose={() => {
          setShowTransactionProcessingModal(false)
          setShowTransactionAbstract(true)
        }}
      />
      {showApprovalModal && (
        <ApprovalModal handleClose={() => setShowApprovalModal(false)} />
      )}
    </>
  )
}
