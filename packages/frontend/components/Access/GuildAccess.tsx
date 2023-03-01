import { useEffect, useState } from "react"

import { AuthStatus, useAuth } from "../../store/auth.store"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import LoadingButton from "@mui/lab/LoadingButton"
import Image from "next/image"
import { AccessStatus, useAccess } from "../../store/access.store"
import { Close, Check, LogoutOutlined } from "@mui/icons-material"

export function GuildAccess() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const [isOpen, setIsOpen] = useState(true)

  const address = useAuth((state) => state.address)
  const authStatus = useAuth((state) => state.status)
  const login = useAuth((state) => state.login)
  const logout = useAuth((state) => state.logout)

  const accessStatus = useAccess((state) => state.status)
  const retriesCount = useAccess((state) => state.retriesCount)
  const errorsCount = useAccess((state) => state.errorsCount)
  const verify = useAccess((state) => state.verify)
  const reset = useAccess((state) => state.reset)

  const formattedAddress =
    address?.substring(0, 13) + "..." + address?.substring(address?.length - 14)

  useEffect(() => {
    if (address) verify()
  }, [address, verify])

  useEffect(() => {
    if (accessStatus === AccessStatus.Verified) {
      // close this modal 3 secs after the verification succeeded
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    } else {
      setIsOpen(true)
    }
  }, [accessStatus])

  const statusParagraph = () => {
    if (authStatus !== AuthStatus.Connected) return <></>

    if (accessStatus === AccessStatus.Verifying) {
      return "Verifying your eligibility ..."
    } else if (accessStatus === AccessStatus.NoAccess) {
      return "You have not joined our guild yet or you do not meet the eligibility criteria!"
    } else if (accessStatus === AccessStatus.Verified) {
      return "Awesome Climber, you are eligibile!"
    } else if (accessStatus === AccessStatus.Error) {
      return `Something went wrong and we cannot verify your eligibility!
          Trying again ... ${errorsCount}/5`
    } else if (accessStatus === AccessStatus.FatalError) {
      return "Something went wrong and we cannot verify your eligibility! Sorry, try again later..."
    }
  }

  return (
    <Dialog
      open={isOpen}
      /* BackdropProps={{ style: { backgroundColor: "" } }} */
      sx={{
        ".MuiPaper-root": {
          width: isMobile ? "100%" : "auto",
        },
        "&": {
          // in order for onboard modal to display above this dialog
          zIndex: 9,
        },
        margin: isMobile ? 1 : "auto",
        backdropFilter: { xs: "blur(0.313rem)", sm: "none" },
      }}
      maxWidth="xs"
    >
      <Paper
        variant="outlined"
        sx={{ p: { xs: "1rem", sm: "1.5rem" }, textAlign: "center" }}
      >
        <Box mt={2}>
          <Image
            src="/assets/images/logo/himalaya.svg"
            width="60"
            height="60"
            alt="ust icon"
          />
        </Box>

        <Typography variant="h5" mt="2rem">
          Join Fuji Guild
        </Typography>

        <Typography mt="1rem" mb="2rem">
          You need to meet the eligibility criteria and to join our guild to
          participate in the V2 private beta testing.
        </Typography>

        <Box mt={2} mb={2}>
          {authStatus !== AuthStatus.Connected ? (
            <LoadingButton
              size="medium"
              fullWidth
              loading={authStatus === AuthStatus.Connecting}
              onClick={() => login()}
            >
              Connect Wallet
            </LoadingButton>
          ) : (
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Tooltip title={statusParagraph()} placement="top" arrow>
                <Button size="large" variant="outlined">
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    {accessStatus === AccessStatus.Verifying ? (
                      <CircularProgress size={15} />
                    ) : accessStatus === AccessStatus.Verified ? (
                      <Check color="success" />
                    ) : (
                      <Close color="error" />
                    )}
                    <Typography>{formattedAddress}</Typography>
                  </Stack>
                </Button>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  size="large"
                  onClick={() => {
                    logout()
                    reset()
                  }}
                >
                  <LogoutOutlined />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
        {accessStatus !== AccessStatus.Verified ? (
          <Button
            variant="primary"
            href="https://guild.xyz/fuji-finance"
            target="_blank"
            size="large"
            fullWidth
            /* disable when checking membership for the first time */
            disabled={
              authStatus !== AuthStatus.Connected ||
              (accessStatus === AccessStatus.Verifying && retriesCount === 0)
            }
          >
            Join Guild
          </Button>
        ) : (
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={() => setIsOpen(false)}
          >
            Go to App
          </Button>
        )}
      </Paper>
    </Dialog>
  )
}

// disabled
// NotConnected
// Connecting
// Verifying && retriesCount === 0