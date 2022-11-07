import { useEffect, useState } from "react"
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
import { useLtv } from "../../store/transaction.slice"
// import { useCost } from "../../store/transaction.slice"

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
  const debtChainId = useStore((state) => state.debtChainId)
  const changeBorrowChain = useStore((state) => state.changeBorrowChain)
  const changeCollateralChain = useStore((state) => state.changeCollateralChain)
  // const debt = useStore((state) => state.position.debt)

  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  const transactionStatus = useStore((state) => state.transactionStatus)
  const setTransactionStatus = useStore((state) => state.setTransactionStatus)
  const setShowTransactionAbstract = useStore(
    (state) => state.setShowTransactionAbstract
  )

  const [showTransactionProcessingModal, setShowTransactionProcessingModal] =
    useState(false)

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

  let error
  if (!address) {
    error = "mustLogin"
  } else if (collateralChainId !== walletChain?.id) {
    error = "wrongNetwork"
  } else if (value > 0 && value > balance) {
    error = "insufficientBalance"
  } else if (ltv > ltvMax) {
    error = "wrongLtv"
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
    </>
  )
}
