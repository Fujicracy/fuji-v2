import { Card, Collapse, Typography, CircularProgress } from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import { useStore } from "../../store"
import styles from "../../styles/components/Borrow.module.css"
import { useState } from "react"

export const Fees = () => {
  const transactionMeta = useStore((state) => state.transactionMeta)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  return (
    <Card
      variant="outlined"
      sx={{ cursor: "pointer", border: "none" }}
      onClick={() => setShowTransactionDetails(!showTransactionDetails)}
    >
      <div className={styles.cardLine} style={{ height: 0 }}>
        <Typography variant="small">Estimated Cost</Typography>
        <div style={{ display: "flex", alignItems: "center" }}>
          {transactionMeta.status === "ready" && (
            <>
              <Typography variant="small">~$3.90</Typography>
              {showTransactionDetails ? (
                <KeyboardArrowUpIcon />
              ) : (
                <KeyboardArrowDownIcon />
              )}
            </>
          )}
          {transactionMeta.status === "fetching" && (
            <CircularProgress size="0.875rem" />
          )}
          {(transactionMeta.status === "error" ||
            transactionMeta.status === "initial") && (
            <Typography variant="small">n/a</Typography>
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
          <Typography variant="small">
            ~${transactionMeta.bridgeFees}
          </Typography>
        </div>
        <br />
        <div className={styles.cardLine} style={{ width: "92%" }}>
          <Typography variant="small">Est. processing time</Typography>
          <Typography variant="small">
            ~{transactionMeta.estimateTime / 60} minutes
          </Typography>
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
  )
}
