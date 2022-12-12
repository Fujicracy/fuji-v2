import {
  Snackbar as MuiSnackbar,
  Box,
  SnackbarContent,
  Typography,
  Slide,
  Stack,
  IconButton,
  Link,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import CheckIcon from "@mui/icons-material/Check"
import ErrorIcon from "@mui/icons-material/Error"
import LaunchIcon from "@mui/icons-material/Launch"
import { useSnack, Snack } from "../store/snackbar.store"
import { transactionLink } from "../helpers/transactionLink"

export function Snackbar() {
  const [snack] = useSnack((s) => s.notifications)
  const close = useSnack((s) => s.close)

  if (!snack) {
    return <></>
  }

  return (
    <MuiSnackbar
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      open={Boolean(snack)}
      sx={{ mt: "2.5rem" }}
      autoHideDuration={snack.autoHideDuration}
      onClose={() => close(snack)}
      TransitionComponent={TransitionLeft}
    >
      <SnackbarContent
        message={<SnackbarBody snack={snack} onClose={close} />}
      />
    </MuiSnackbar>
  )
}

function TransitionLeft(props: any) {
  return <Slide {...props} direction="left" />
}

type SnackBodyProps = { snack: Snack; onClose: (s: Snack) => void }
function SnackbarBody({ snack, onClose }: SnackBodyProps) {
  let icon
  if (snack.icon === "success") {
    icon = <CheckIcon color="success" />
  } else if (snack.icon === "error") {
    icon = <ErrorIcon color="error" />
  }

  return (
    <Stack direction="row" width="350px">
      {icon && <Box mr={1}>{icon}</Box>}
      <Box pr={3}>
        <Typography variant="body1">{snack.title}</Typography>
        {snack.body && (
          <Typography variant="xsmallDark">{snack.body}</Typography>
        )}
        {snack.transactionLink?.chainId && snack.transactionLink.hash && (
          <Link
            href={transactionLink(
              snack.transactionLink.chainId,
              snack.transactionLink.hash
            )}
            target="_blank"
            variant="smallDark"
          >
            View transaction{" "}
            <LaunchIcon
              sx={{ top: "1px", position: "relative" }}
              fontSize="inherit"
            />
          </Link>
        )}
      </Box>
      <IconButton
        sx={{ position: "absolute", top: 8, right: 8 }}
        onClick={() => onClose(snack)}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Stack>
  )
}
