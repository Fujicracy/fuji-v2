import { useState } from "react"
import {
  Divider,
  Button,
  Typography,
  CardContent,
  Card,
  Grid,
  CircularProgress,
  Collapse,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import Image from "next/image"

import { useStore } from "../../store"
import styles from "../../styles/components/Borrow.module.css"
import TransactionProcessingModal from "./TransactionProcessingModal"
import { ChainSelect } from "./ChainSelect"
import TokenCard from "./TokenCard"
import shallow from "zustand/shallow"

export default function Borrow() {
  const address = useStore((state) => state.address)
  const login = useStore((state) => state.login)

  const collateral = useStore((state) => state.collateral)
  const borrow = useStore((state) => state.borrow)
  const changeBorrowChain = useStore((state) => state.changeBorrowChain)
  const changeCollateralChain = useStore((state) => state.changeCollateralChain)

  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  const {
    transactionStatus,
    setTransactionStatus,
    setShowTransactionAbstract,
  } = useStore((state) => ({
    transactionStatus: state.transactionStatus,
    setTransactionStatus: state.setTransactionStatus,
    setShowTransactionAbstract: state.setShowTransactionAbstract,
  }))

  const [showTransactionProcessingModal, setShowTransactionProcessingModal] =
    useState(false)

  const { value, balance } = useStore(
    (state) => ({
      value: state.collateral.value,
      balance: state.collateral.balance,
    }),
    shallow
  )

  console.log({ value, balance })

  let error
  if (!address) {
    error = "mustLogin"
  } else if (value > 0 && value > balance) {
    error = "insufficientBalance"
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
            value={collateral.chainId}
            onChange={(chainId) => changeCollateralChain(chainId, address)}
          />
          <TokenCard type="collateral" />

          <br />

          <ChainSelect
            label="Borrow to"
            type="borrow"
            value={borrow.chainId}
            onChange={(chainId) => changeBorrowChain(chainId, address)}
          />
          <TokenCard type="borrow" />

          <br />

          <Card
            variant="outlined"
            sx={{ cursor: "pointer", border: "none" }}
            onClick={() => setShowTransactionDetails(!showTransactionDetails)}
          >
            <div className={styles.cardLine} style={{ height: 0 }}>
              <Typography variant="small">Estimated Cost</Typography>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="small">~$3.90</Typography>
                {showTransactionDetails ? (
                  <KeyboardArrowUpIcon />
                ) : (
                  <KeyboardArrowDownIcon />
                )}
              </div>
            </div>
            <Collapse in={showTransactionDetails} sx={{ width: "100%" }}>
              <div
                className={styles.cardLine}
                style={{ width: "92%", marginTop: "1rem" }}
              >
                <Typography variant="small">Gas fees</Typography>
                <Typography variant="small">~$1.90</Typography>
              </div>
              <br />
              <div className={styles.cardLine} style={{ width: "92%" }}>
                <Typography variant="small">Bridges fees</Typography>
                <Typography variant="small">~$2.00</Typography>
              </div>
              <br />
              <div className={styles.cardLine} style={{ width: "92%" }}>
                <Typography variant="small">Est. processing time</Typography>
                <Typography variant="small">~2 Minutes</Typography>
              </div>
              <br />
              <div className={styles.cardLine} style={{ width: "92%" }}>
                <Typography variant="small">Route</Typography>
                <Typography variant="small">
                  <u>{"ETH > Polygon"}</u>
                </Typography>
              </div>
            </Collapse>
          </Card>
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
          {error === "insufficientBalance" && (
            <Button variant="gradient" disabled fullWidth>
              Insufficient {collateral.token.symbol} balance
            </Button>
          )}

          {!error && (
            <>
              <Button
                variant="primary"
                disabled={
                  collateral.value <= 0 ||
                  collateral.value > collateral.balance ||
                  collateral.balance <= 0
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
                  collateral.value <= 0 ||
                  collateral.value > collateral.balance ||
                  collateral.balance < 0
                }
              >
                Borrow
              </Button>
            </>
          )}

          <br />
          <br />

          <Grid container justifyContent="center">
            <Typography variant="small">
              Powered by
              <a
                href="https://www.connext.network/"
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src="/assets/images/logo/connext-title.svg"
                  height={16}
                  width={95}
                  alt="Connext logo"
                />
              </a>
            </Typography>
          </Grid>
        </CardContent>
      </Card>
      <TransactionProcessingModal
        open={showTransactionProcessingModal}
        handleClose={() => {
          setShowTransactionProcessingModal(false)
          setShowTransactionAbstract(true)
        }}
      />
    </>
  )
}
