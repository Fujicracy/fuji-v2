import { ReactNode, useState } from "react"
import {
  Card,
  Collapse,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import { useBorrow } from "../../store/borrow.store"
import { toNotSoFixed } from "../../helpers/values"

function Fees() {
  const transactionMeta = useBorrow((state) => state.transactionMeta)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const show = showTransactionDetails && transactionMeta.status === "ready"

  const handleClick = () => {
    if (transactionMeta.status === "ready") {
      setShowTransactionDetails(!showTransactionDetails)
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{ cursor: "pointer", border: "none" }}
      onClick={handleClick}
    >
      <Stack direction="row" justifyContent="space-between" width="100%">
        <Typography variant="small" display="block">
          Estimated Cost
        </Typography>
        {transactionMeta.status === "ready" && (
          <Stack direction="row" alignItems="center" maxHeight="22px">
            <Typography variant="small">
              {`~$${transactionMeta.bridgeFee.toFixed(2)} + gas`}
            </Typography>
            {show ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </Stack>
        )}
        {transactionMeta.status === "fetching" && (
          <Stack direction="row" alignItems="center" maxHeight="22px">
            <CircularProgress size="0.875rem" />
          </Stack>
        )}
        {(transactionMeta.status === "error" ||
          transactionMeta.status === "initial") && (
          <Typography variant="small" display="block">
            n/a
          </Typography>
        )}
      </Stack>

      <Collapse in={show} sx={{ width: "100%" }}>
        <Fee
          label="Bridge fee"
          value={`~$${toNotSoFixed(transactionMeta.bridgeFee)}`}
        />
        <Fee
          label="Est. processing time"
          value={`~${transactionMeta.estimateTime / 60} minutes`}
        />
      </Collapse>
    </Card>
  )
}

export default Fees

type FeeProps = {
  label: string
  value: string | ReactNode
}

const Fee = ({ label, value }: FeeProps) => (
  <Stack direction="row" justifyContent="space-between" width="92%" mt="1rem">
    <Typography variant="small">{label}</Typography>
    <Typography variant="small">{value}</Typography>
  </Stack>
)
