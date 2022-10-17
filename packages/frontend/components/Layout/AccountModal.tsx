import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  Typography,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import LaunchIcon from "@mui/icons-material/Launch"
import CircleIcon from "@mui/icons-material/Circle"
import CheckIcon from "@mui/icons-material/Check"

import { useTransactionStore } from "../../store/useTransactionStore"

type AccountModalProps = {
  isOpen: boolean
  address: string
  closeAccountModal: (e: {}) => void
}

export default function AccountModal(props: AccountModalProps) {
  const { palette } = useTheme()
  const { transactionStatus } = useTransactionStore((state) => ({
    transactionStatus: state.transactionStatus,
  }))

  return (
    <Dialog
      onClose={props.closeAccountModal}
      open={props.isOpen}
      sx={{ ".MuiPaper-root": { background: "transparent" } }}
    >
      <DialogContent
        sx={{
          p: "1.5rem",
          background: palette.secondary.contrastText,
          borderTopLeftRadius: "1.125rem",
          borderTopRightRadius: "1.125rem",
          border: `0.063rem solid ${palette.secondary.light}`,
          borderBottom: "none",
        }}
      >
        <CloseIcon
          sx={{
            cursor: "pointer",
            position: "absolute",
            right: "2rem",
          }}
          onClick={props.closeAccountModal}
        />
        <Typography variant="body2">Account</Typography>
        <Card
          sx={{
            border: `0.063rem solid ${palette.secondary.light}`,
            mt: "1.5rem",
          }}
        >
          <CardContent>
            <Grid container alignItems="center">
              <Typography variant="xsmall" sx={{ mr: "5.625rem" }}>
                Connected with MetaMask
              </Typography>
              <Button
                sx={{
                  ml: "0.5rem",
                  color: palette.primary.main,
                  background: "transparent",
                  border: `1px solid ${palette.primary.dark}`,
                  textTransform: "capitalize",
                  p: "0 .6rem",
                  fontSize: "0.75rem",
                }}
              >
                Disconnect
              </Button>
              <Button
                sx={{
                  ml: "0.5rem",
                  color: palette.primary.main,
                  background: "transparent",
                  border: `1px solid ${palette.primary.dark}`,
                  textTransform: "capitalize",
                  p: "0 .6rem",
                  fontSize: "0.75rem",
                }}
              >
                Change
              </Button>
            </Grid>
            <Grid container alignItems="center">
              <CircleIcon />
              <Typography
                variant="h5"
                sx={{ ml: "0.5rem", mt: "0.625rem", mb: "0.625rem" }}
              >
                {props.address}
              </Typography>
            </Grid>
            <Grid container alignItems="center">
              <ContentCopyIcon
                fontSize="small"
                sx={{ color: palette.primary.main, mr: "0.438rem" }}
              />
              <Typography variant="small" color={palette.primary.main}>
                Copy Address
              </Typography>
              <LaunchIcon
                fontSize="small"
                sx={{
                  color: palette.info.dark,
                  ml: "1.188rem",
                  mr: "0.438rem",
                }}
              />
              <Typography variant="small" color={palette.info.dark}>
                View on Explorer
              </Typography>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
      <Box
        sx={{
          p: "1.5rem",
          background: palette.secondary.dark,
          borderBottomLeftRadius: "1.125rem",
          borderBottomRightRadius: "1.125rem",
        }}
      >
        <Grid container justifyContent="space-between">
          <Typography variant="body">Recent Transactions</Typography>
          <Typography variant="small">clear all</Typography>
        </Grid>
        <Grid sx={{ mt: "1rem" }} container justifyContent="space-between">
          <Box sx={{ maxWidth: "20rem" }}>
            <Typography variant="small">
              Deposit 1.00 ETH on Ethereum and Borrow 675 USDC on Polygon{" "}
            </Typography>
          </Box>
          {transactionStatus ? (
            <CircularProgress size={16} />
          ) : (
            <CheckIcon
              sx={{
                backgroundColor: "rgba(66, 255, 0, 0.1)", // TODO: use theme color (palette.success.dark)
                color: palette.success.dark,
                borderRadius: "100%",
                padding: "0.25rem",
              }}
            />
          )}
        </Grid>
      </Box>
    </Dialog>
  )
}
