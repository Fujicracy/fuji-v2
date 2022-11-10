import { useEffect, useState } from "react"
import {
  Divider,
  Button,
  Typography,
  CardContent,
  Card,
  Grid,
  CircularProgress,
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

export default function Borrow() {
  const address = useStore((state) => state.address)
  const walletChain = useStore((state) => state.chain)
  const changeChain = useStore((state) => state.changeChain)
  const updateBalance = useStore((state) => state.updateBalances)
  useEffect(() => {
    updateBalance("collateral")
  }, [address, updateBalance])

  const login = useStore((state) => state.login)

  const collateral = useStore((state) => state.position.collateral)
  const collateralChainId = useStore((state) => state.collateralChainId)
  const collateralAllowance = useStore((state) => state.collateralAllowance)
  const debtChainId = useStore((state) => state.debtChainId)
  const changeBorrowChain = useStore((state) => state.changeBorrowChain)
  const changeCollateralChain = useStore((state) => state.changeCollateralChain)
  // const debt = useStore((state) => state.position.debt)

  const transactionStatus = useStore((state) => state.transactionStatus)
  const setTransactionStatus = useStore((state) => state.setTransactionStatus)
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

  let error:
    | "mustLogin"
    | "wrongNetwork"
    | "insufficientBalance"
    | "wrongLtv"
    | "mustAllow"
    | undefined
  // TODO: refacto error as action (contain ReactoNode)
  if (!address) {
    error = "mustLogin"
  } else if (collateralChainId !== walletChain?.id) {
    error = "wrongNetwork"
  } else if (value > 0 && value > balance) {
    error = "insufficientBalance"
  } else if (ltv > ltvMax) {
    error = "wrongLtv"
  } else if (
    collateralAllowance?.value !== undefined &&
    collateralAllowance.value < collateral.amount
  ) {
    error = "mustAllow"
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

          {error === "mustLogin" && (
            <Button
              variant="gradient"
              onClick={() => login()}
              fullWidth
              data-cy="borrow-login"
            >
              Connect wallet
            </Button>
          )}
          {error === "wrongNetwork" && (
            <Button
              variant="gradient"
              fullWidth
              onClick={() => changeChain(collateral.token.chainId)}
            >
              Switch network
            </Button>
          )}
          {error === "insufficientBalance" && (
            <Button variant="gradient" disabled fullWidth>
              Insufficient {collateral.token.symbol} balance
            </Button>
          )}
          {error === "wrongLtv" && (
            <Button variant="gradient" disabled fullWidth>
              Not enough collateral
            </Button>
          )}
          {error === "mustAllow" && (
            <Button
              variant="gradient"
              fullWidth
              onClick={() => setShowApprovalModal(true)}
            >
              Allow
            </Button>
          )}

          {!error && (
            <>
              <Button
                variant="primary"
                disabled={
                  collateral.amount <= 0 ||
                  collateral.amount > balance ||
                  collateral.amount <= 0
                }
                onClick={() => alert("not implemented")}
                fullWidth
              >
                Sign
              </Button>

              <br />
              <br />

              <Button
                variant="gradient"
                onClick={() => {
                  setTransactionStatus(true)
                  setShowTransactionProcessingModal(true)
                }}
                fullWidth
                className={styles.btn}
                startIcon={
                  transactionStatus ? <CircularProgress size={15} /> : undefined
                }
                disabled={
                  collateral.amount <= 0 ||
                  collateral.amount > balance ||
                  balance < 0
                }
              >
                Borrow
              </Button>
            </>
          )}

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
