import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  Snackbar,
  Typography,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import LaunchIcon from "@mui/icons-material/Launch"
import CircleIcon from "@mui/icons-material/Circle"
import CheckIcon from "@mui/icons-material/Check"

import { useTransactionStore } from "../../store/useTransactionStore"
import { useState } from "react"
import { useStore } from "../../store"

type AccountModalProps = {
  isOpen: boolean
  address: string
  closeAccountModal: (e: {}) => void
}

export default function AccountModal(props: AccountModalProps) {
  const { palette } = useTheme()
  const logout = useStore((state) => state.logout)

  const { transactionStatus } = useTransactionStore((state) => ({
    transactionStatus: state.transactionStatus,
  }))

  const [copyAddress, setCopyAddress] = useState(false)

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return
    }
    setCopyAddress(false)
  }

  return (
    <Dialog onClose={props.closeAccountModal} open={props.isOpen}>
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
              <Typography variant="xsmall" sx={{ mr: "9rem" }}>
                Connected with MetaMask
              </Typography>
              <Button variant="small" onClick={() => logout()}>
                Disconnect
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
              <Grid item>
                <Grid
                  container
                  alignItems="center"
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    navigator.clipboard.writeText(props.address)
                    setCopyAddress(true)
                  }}
                >
                  <ContentCopyIcon
                    fontSize="small"
                    sx={{ color: palette.primary.main, mr: "0.438rem" }}
                  />
                  <Typography variant="small" color={palette.primary.main}>
                    Copy Address
                  </Typography>
                  <Snackbar
                    open={copyAddress}
                    autoHideDuration={2000}
                    onClose={handleClose}
                  >
                    <Alert
                      onClose={handleClose}
                      severity="success"
                      sx={{ color: palette.success.main }}
                    >
                      Address copied!
                    </Alert>
                  </Snackbar>
                </Grid>
              </Grid>
              <Grid item>
                <a
                  href={"https://etherscan.io/address/" + props.address}
                  target="_blank" // TODO: target='_blank' doesn't work with NextJS "<Link>"...
                  rel="noreferrer"
                >
                  <Grid container alignItems="center">
                    <>
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
                    </>
                  </Grid>
                </a>
              </Grid>
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
