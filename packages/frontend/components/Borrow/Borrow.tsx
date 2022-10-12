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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Container,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import Image from "next/image"

import { chains, Chain } from "../../store"
import SelectTokenCard from "./SelectTokenCard"
import styles from "../../styles/components/Borrow.module.css"
import TransactionProcessingModal from "./TransactionProcessingModal"

export default function Borrow() {
  const { palette } = useTheme()
  // TODO: Below is a remain of Xstate. I let it here to avoid conflic, but this should be removed in the future
  const current = { matches: (arg: string) => true }
  const tokens = ["ETH", "USDC"] // TODO: Should be selected depending on ??

  const [collateralChainId, setCollateralChain] = useState(chains[0].id)
  const [collateralValue, setCollateralValue] = useState("")
  const [collateralToken, setCollateralToken] = useState(tokens[0])

  const [borrowChainId, setBorrowChainId] = useState(chains[1].id)
  const [borrowValue, setBorrowValue] = useState("")
  const [borrowToken, setBorrowToken] = useState(tokens[1])
  const [transactionIsProcessing, setTransactionIsProcessing] = useState(false)
  const [showTransactionProcessingModal, setShowTransactionProcessingModal] =
    useState(false)

  return (
    <Container>
      {current.matches("editing") && (
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
                    onChange={(e) => setCollateralChain(e.target.value)}
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
                  ></Select>
                </Grid>
              </FormControl>

              <SelectTokenCard
                value={collateralValue}
                onChangeValue={(e) => setCollateralValue(e.target.value)}
                token={collateralToken}
                onChangeToken={(e) => setCollateralToken(e.target.value)}
                tokens={tokens}
                type="collateral"
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
                    onChange={(e) => setBorrowChainId(e.target.value)}
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
                    {chains.map((chain: Chain) => (
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
                token={borrowToken}
                onChangeToken={(e) => setBorrowToken(e.target.value)}
                tokens={tokens}
                type="borrow"
              />

              <br />

              <Accordion
                sx={{
                  "::before": { content: "none" },
                  padding: "0.3rem 0.5rem",
                  boxShadow: "none",
                  background: palette.secondary.dark,
                  borderRadius: "0.5rem",
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div className={styles.cardLine}>
                    <Typography variant="small">Estimated Cost</Typography>
                    <Typography variant="small">~$3.90</Typography>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <div className={styles.cardLine} style={{ width: "92%" }}>
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
                    <Typography variant="small">
                      Est. processing time
                    </Typography>
                    <Typography variant="small">~2 Minutes</Typography>
                  </div>
                  <br />
                  <div className={styles.cardLine} style={{ width: "92%" }}>
                    <Typography variant="small">Route</Typography>
                    <Typography variant="small">
                      <u>{"ETH > Polygon"}</u>
                    </Typography>
                  </div>
                </AccordionDetails>
              </Accordion>

              <br />

              <Button
                variant="primary"
                disabled
                onClick={() => alert("not implemented")}
                fullWidth
                className={styles.btn}
              >
                Sign
              </Button>

              <br />
              <br />

              <Button
                variant="gradient"
                onClick={() => {
                  setTransactionIsProcessing(true)
                  setShowTransactionProcessingModal(true)
                }}
                fullWidth
                className={styles.btn}
                startIcon={
                  transactionIsProcessing ? (
                    <CircularProgress size={15} />
                  ) : undefined
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
            handleClose={() => setShowTransactionProcessingModal(false)}
          />
        </>
      )}
    </Container>
  )
}
