import { MouseEvent, useState } from "react"
import {
  Box,
  Button,
  Dialog,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"
import Image from "next/image"

type ApprovalModalProps = {
  handleClose: (e: MouseEvent) => void
}

export default function ApprovalModal(props: ApprovalModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [infiniteApproval, setInfiniteApproval] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInfiniteApproval(event.target.checked)
  }

  return (
    <Dialog
      open
      onClose={props.handleClose}
      sx={{
        ".MuiPaper-root": {
          width: isMobile ? "100%" : "auto",
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
        {/* TODO: Disable while waiting for approval. Note: also disable "esc" key */}
        <CloseIcon
          sx={{ cursor: "pointer", position: "absolute", right: 16, top: 16 }}
          onClick={props.handleClose}
          fontSize="small"
        />

        <Box mt={2}>
          <Image src="/assets/images/usdroundicon.png" width="60" height="60" />
        </Box>

        <Typography variant="h5" mt="2rem">
          Approve spending limit
        </Typography>

        <Typography mt="1rem">
          To avoid having to reapprove for subsequent transactions, you could
          enable infinite approval.
        </Typography>

        <Typography mt="1rem">
          Otherwise only the exact amount for this transaction will be allowed
          to be transfered from your wallet
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt="2rem"
          color="grey"
        >
          <Typography variant="small">Infinite approval</Typography>
          <FormControlLabel
            control={
              <Switch checked={infiniteApproval} onChange={handleChange} />
            }
            label={infiniteApproval ? "Enabled" : "Disabled"}
            labelPlacement="start"
          />
        </Stack>
        <Button variant="gradient" fullWidth>
          Approve
        </Button>
      </Paper>
    </Dialog>
  )
}
