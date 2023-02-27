import { useEffect, useState } from "react"

import { useAuth } from "../../store/auth.store"
import { guild, setProjectName } from "@guildxyz/sdk"
import {
  Box,
  Dialog,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import LoadingButton from "@mui/lab/LoadingButton"
import Image from "next/image"

const FUJI_GUILD_ID = 461
setProjectName("Fuji Finance")

export function GuildAccess() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const address = useAuth((state) => state.address)
  const login = useAuth((state) => state.login)

  const [hasAccess, setHasAccess] = useState(false)
  //const [checkingAccess, setCheckingAccess] = useState(true)

  // display loader: Checking access...
  useEffect(() => {
    ;(async () => {
      if (address) {
        const reqs = await guild.getUserAccess(FUJI_GUILD_ID, address)
        const r = reqs.find((r) => r.access)
        setHasAccess(r?.access as boolean)
        if (!r) {
          console.log("No access :(")
          // display rules and no access
        } else {
          console.log("Access :)")
        }
      } else {
        // display rules of access and connect wallet
      }
      // hide loader
    })()
  }, [address])

  return (
    <Dialog
      open={!hasAccess}
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
          To join Fuji V2 private beta, join our guild.
        </Typography>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt="2rem"
          color="grey"
        ></Stack>
        <LoadingButton
          variant="gradient"
          size="large"
          fullWidth
          loading={false}
          onClick={() => login()}
        >
          Connect Wallet
        </LoadingButton>
      </Paper>
    </Dialog>
  )
}
