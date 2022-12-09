import {
  Snackbar,
  Box,
  SnackbarContent,
  Grid,
  Typography,
  Slide,
  useTheme,
  Stack,
  IconButton,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import CheckIcon from "@mui/icons-material/Check"
import ErrorIcon from "@mui/icons-material/Error"
import { useSnack, Snack } from "../store/notification.store"

export function Notifications() {
  const [snack] = useSnack((s) => s.notifications)
  const close = useSnack((s) => s.close)

  if (!snack) {
    return <></>
  }

  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      open={Boolean(snack)}
      sx={{ mt: "2.5rem" }}
      autoHideDuration={snack.autoHideDuration || 6000}
      onClose={() => close(snack)}
      TransitionComponent={TransitionLeft}
    >
      <SnackbarContent
        message={<SnacbarBody snack={snack} onClose={close} />}
      />
    </Snackbar>
  )
}

function TransitionLeft(props: any) {
  return <Slide {...props} direction="left" />
}

type SnackBodyProps = { snack: Snack; onClose: (s: Snack) => void }
function SnacbarBody({ snack, onClose }: SnackBodyProps) {
  let icon
  if (snack.icon === "success") {
    icon = <CheckIcon color="success" />
  } else if (snack.icon === "error") {
    icon = <ErrorIcon color="error" />
  }

  return (
    <Stack direction="row" width="350px">
      {icon && <Box mr={1}>{icon}</Box>}
      <Box>
        <Typography variant="body1">{snack.title}</Typography>
        {snack.body && (
          <Typography variant="xsmallDark">{snack.body}</Typography>
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
