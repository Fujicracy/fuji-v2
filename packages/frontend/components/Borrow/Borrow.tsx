import { useEffect, useState } from "react"
import {
  Divider,
  Button,
  Typography,
  CardContent,
  Card,
  Grid,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Container,
  Collapse,
  useTheme,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import Image from "next/image"

import { chains } from "../../store/auth.slice"
import { useStore } from "../../store"
import SelectTokenCard from "./SelectTokenCard"
import styles from "../../styles/components/Borrow.module.css"
import TransactionProcessingModal from "./TransactionProcessingModal"

export default function Borrow() {
  const { palette } = useTheme()

  const address = useStore((state) => state.address)
  const status = useStore((state) => state.status)
  const chain = useStore((state) => state.chain)
  const changeBorrowChain = useStore((state) => state.changeBorrowChain)
  const changeCollateralChain = useStore((state) => state.changeCollateralChain)

  useEffect(() => {
    if (chain && address) {
      // Set default chain as wallet chain and mainnet
      // TODO: Do it in the store or initial state
      changeCollateralChain(chain.id, address)
      changeBorrowChain(chains[0].id, address)
    }
  }, [chain, address, changeBorrowChain, changeCollateralChain])

  const collateral = useStore((state) => state.collateral)
  const borrow = useStore((state) => state.borrow)

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

  if (status !== "connected") {
    return <>Please connect wallet</>
  }

  return (
    <Container>
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

          <FormControl>
            <Grid container alignItems="center">
              <label id="collateral-chain-label" className={styles.selectLabel}>
                Collateral from
              </label>
              <Select
                labelId="collateral-chain-label"
                id="collateral-chain"
                value={collateral.chainId}
                onChange={() => alert("Not implemented")}
                IconComponent={KeyboardArrowDownIcon}
                sx={{
                  marginBottom: "1rem",
                  boxShadow: "none",
                  ".MuiOutlinedInput-notchedOutline": {
                    border: 0,
                  },
                }}
                variant="standard"
                disableUnderline
              >
                {chains.map((chain) => (
                  <MenuItem key={chain.id} value={chain.id}>
                    <Grid container>
                      <Image
                        src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                        height={18}
                        width={18}
                        alt={chain.label}
                      />
                      <span style={{ marginLeft: "0.5rem" }}>
                        <Typography variant="small">{chain.label}</Typography>
                      </span>
                    </Grid>
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </FormControl>

          <SelectTokenCard type="collateral" />

          {collateral.value > collateral.balance && (
            <Typography
              variant="small"
              mt=".5rem"
              sx={{ color: palette.error.dark, display: "block" }}
            >
              Insufficient balance
            </Typography>
          )}

          <FormControl>
            <Grid container alignItems="center">
              <label id="borrow-chain-label" className={styles.selectLabel}>
                Borrow to
              </label>
              <Select
                labelId="borrow-chain-label"
                id="borrow-chain"
                value={borrow.chainId}
                onChange={() => alert("not implemented")}
                IconComponent={KeyboardArrowDownIcon}
                sx={{
                  marginBottom: "1rem",
                  boxShadow: "none",
                  ".MuiOutlinedInput-notchedOutline": {
                    border: 0,
                  },
                }}
                variant="standard"
                disableUnderline
              >
                {chains.map((chain) => (
                  <MenuItem key={chain.id} value={chain.id}>
                    <Grid container>
                      <Image
                        src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                        height={18}
                        width={18}
                        alt={chain.label}
                      />
                      <span style={{ marginLeft: "0.5rem" }}>
                        <Typography variant={"small"}>
                          {chain.label} Network
                        </Typography>
                      </span>
                    </Grid>
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </FormControl>

          <SelectTokenCard type="borrow" />

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
                  <KeyboardArrowDownIcon />
                ) : (
                  <KeyboardArrowUpIcon />
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
    </Container>
  )
}
