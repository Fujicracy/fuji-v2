import { useEffect, useState } from "react"

import { AuthStatus, useAuth } from "../../store/auth.store"
import {
  Box,
  Button,
  Dialog,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import LoadingButton from "@mui/lab/LoadingButton"
import Image from "next/image"
import { AccessStatus, useAccess } from "../../store/access.store"

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
    address?.substring(0, 5) + "..." + address?.substring(address?.length - 4)

  useEffect(() => {
    ;(async () => {
      if (address) await verify(address)
    })()
  }, [address, verify])

  useEffect(() => {
    if (accessStatus === AccessStatus.Verified) {
      // close this modal 3 secs after the verification succeeded
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    }
  }, [accessStatus])

  const statusParagraph = () => {
    if (authStatus !== AuthStatus.Connected) return <></>

    if (accessStatus === AccessStatus.Verifying) {
      return (
        <Typography mt="1rem">Status: verifying your eligibility...</Typography>
      )
    } else if (accessStatus === AccessStatus.NoAccess) {
      return (
        <Typography mt="1rem">
          Status: you have not joined our guild yet or you do not meet the
          eligibility criteria!
        </Typography>
      )
    } else if (accessStatus === AccessStatus.Verified) {
      return (
        <Typography mt="1rem">
          Status: Awesome Climber, you are eligibile!
        </Typography>
      )
    } else if (accessStatus === AccessStatus.Error) {
      return (
        <Typography mt="1rem">
          Status: something went wrong and we cannot verify your eligibility!
          Trying again ... {errorsCount}/5
        </Typography>
      )
    } else if (accessStatus === AccessStatus.FatalError) {
      return (
        <Typography mt="1rem">
          Status: something went wrong and we cannot verify your eligibility!
          Sorry, try again later...
        </Typography>
      )
    }
  }

  const openGuildPage = () => {
    // TODO: redirect to guild.xyz/fuji-finance
    console.log("TODO: open guild")
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

        <Typography mt="1rem">
          Join our guild to participate in the V2 private beta testing.
        </Typography>

        {statusParagraph()}

        {authStatus !== AuthStatus.Connected ? (
          <LoadingButton
            variant="gradient"
            size="large"
            fullWidth
            loading={authStatus === AuthStatus.Connecting}
            onClick={() => login()}
          >
            Connect Wallet
          </LoadingButton>
        ) : (
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="small">{formattedAddress}</Typography>
            <Button
              size="small"
              onClick={() => {
                logout()
                reset()
              }}
            >
              Out
            </Button>
          </Stack>
        )}
        {accessStatus !== AccessStatus.Verified ? (
          <Button
            variant="primary"
            size="large"
            fullWidth
            /* disable when checking membership for the first time */
            disabled={
              authStatus !== AuthStatus.Connected ||
              (accessStatus === AccessStatus.Verifying && retriesCount === 0)
            }
            onClick={openGuildPage}
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
