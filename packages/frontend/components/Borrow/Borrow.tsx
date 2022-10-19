import { useState } from "react"
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
  SelectChangeEvent,
  CircularProgress,
  Container,
  Collapse,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import Image from "next/image"
import shallow from "zustand/shallow"

import { Address } from "@x-fuji/sdk"
import { BigNumber } from "ethers"
import { getTokenBySymbol } from "../../services/TokenServices"
import { formatEther } from "ethers/lib/utils"
import { chains, Chain, sdk } from "../../store/auth.slice"
import { useStore } from "../../store"
import SelectTokenCard from "./SelectTokenCard"
import styles from "../../styles/components/Borrow.module.css"
import TransactionProcessingModal from "./TransactionProcessingModal"

export default function Borrow() {
  const { address, status } = useStore(
    (state) => ({
      status: state.status,
      address: state.address,
    }),
    shallow
  )

  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  const [collateralChainId, setCollateralChainId] = useState(chains[0].id)
  const [collateralValue, setCollateralValue] = useState("")
  const [collateralTokens, setCollateralTokens] = useState(
    sdk.getCollateralForChain(parseInt(collateralChainId))
  )
  const [collateralToken, setCollateralToken] = useState(collateralTokens[0])

  const [borrowChainId, setBorrowChainId] = useState(chains[2].id)
  const [borrowValue, setBorrowValue] = useState("")
  const [borrowTokens, setBorrowTokens] = useState(
    sdk.getDebtForChain(parseInt(borrowChainId))
  )
  const [borrowToken, setBorrowToken] = useState(borrowTokens[0])

  const [collateralTokenBalance, setCollateralTokenBalance] = useState(0)
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

  if (status === "connected") {
    sdk
      .getBalanceFor(collateralToken, new Address(String(address)))
      .then((res: BigNumber) => {
        const hexString = res._hex.toString()
        const balance = parseFloat(formatEther(hexString))
        setCollateralTokenBalance(balance)
      })
    // TODO: use getBatchTokenBalances() SDK method!
  }

  const handleCollateralChange = (e: SelectChangeEvent<string>) => {
    setCollateralChainId(e.target.value)
    const tokens = sdk.getCollateralForChain(parseInt(e.target.value))
    setCollateralTokens(tokens)
    setCollateralToken(tokens[0])
  }

  const handleBorrowChange = (e: SelectChangeEvent<string>) => {
    setBorrowChainId(e.target.value)
    const tokens = sdk.getDebtForChain(parseInt(e.target.value))
    setBorrowTokens(tokens)
    setBorrowToken(tokens[0])
  }

  return (
    <Container>
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

            <FormControl>
              <Grid container alignItems="center">
                <label
                  id="collateral-chain-label"
                  className={styles.selectLabel}
                >
                  Collateral from
                </label>
                <Select
                  labelId="collateral-chain-label"
                  id="collateral-chain"
                  value={collateralChainId}
                  onChange={handleCollateralChange}
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
                        <span
                          style={{
                            marginLeft: "0.5rem",
                          }}
                        >
                          <Typography variant="small">
                            {chain.label} Network
                          </Typography>
                        </span>
                      </Grid>
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </FormControl>

            <SelectTokenCard
              value={collateralValue}
              onChangeValue={(e) => setCollateralValue(e.target.value)}
              token={collateralToken.symbol}
              onChangeToken={(e) =>
                setCollateralToken(
                  getTokenBySymbol(e.target.value, collateralTokens)
                )
              }
              tokens={collateralTokens}
              type="collateral"
              balance={collateralTokenBalance}
            />

            <FormControl>
              <Grid container alignItems="center">
                <label id="borrow-chain-label" className={styles.selectLabel}>
                  Borrow to
                </label>
                <Select
                  labelId="borrow-chain-label"
                  id="borrow-chain"
                  value={borrowChainId}
                  onChange={handleBorrowChange}
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
                        <span
                          style={{
                            marginLeft: "0.5rem",
                          }}
                        >
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

            <SelectTokenCard
              value={borrowValue}
              onChangeValue={(e) => setBorrowValue(e.target.value)}
              token={borrowToken.symbol}
              onChangeToken={(e) =>
                setBorrowToken(getTokenBySymbol(e.target.value, borrowTokens))
              }
              tokens={borrowTokens}
              type="borrow"
              balance={0}
            />

            <br />
            <Card
              variant="outlined"
              sx={{ cursor: "pointer", border: "none" }}
              onClick={() => setShowTransactionDetails(!showTransactionDetails)}
            >
              <div className={styles.cardLine} style={{ height: 0 }}>
                <Typography variant="small">Estimated Cost</Typography>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
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
              disabled
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
      </>
    </Container>
  )
}
