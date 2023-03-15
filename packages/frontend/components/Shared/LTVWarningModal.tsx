import { Button, Typography, Box, Dialog, Paper } from "@mui/material"
import { useTheme } from "@mui/material/styles"

type LTVWarningModalProps = {
  open: boolean
  ltv: number
  onClose: () => void
  action: () => void
}

export function LTVWarningModal({
  open,
  onClose,
  action,
  ltv,
}: LTVWarningModalProps) {
  const { palette } = useTheme()

  const message = `The Loan-to-Value of your position becomes ${ltv.toFixed(
    2
  )}% that's very close to the maximum allowed. Your position risks being liquidated if the price of the collateral changes. Please, make sure you understand the risks associated with this operation. We highly recommend you change the amount of the collateral and/or the debt so that your position LTV reaches a healthier level.`

  return (
    <Dialog open={open}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: "30rem",
          p: { xs: "1rem", sm: "1.5rem" },
          textAlign: "center",
        }}
      >
        <Typography variant="h5" color={palette.text.primary}>
          Warning
        </Typography>

        <Typography mt="1rem" textAlign="start" sx={{ fontSize: "0.875rem" }}>
          {message}
        </Typography>

        <Box
          mt="1.5rem"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: "1rem", sm: "2rem" },
          }}
        >
          <Button
            variant="secondary"
            fullWidth
            onClick={action}
            size="medium"
            data-cy="accept-ltv-warning"
          >
            Proceed anyway
          </Button>
          <Button
            variant="gradient"
            size="medium"
            fullWidth
            onClick={onClose}
            data-cy="change-ltv"
          >
            Change
          </Button>
        </Box>
      </Paper>
    </Dialog>
  )
}

export default LTVWarningModal
