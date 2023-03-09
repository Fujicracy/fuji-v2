import { Box, Dialog, Paper, Typography, useMediaQuery } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"
import Image from "next/image"

import { useBorrow } from "../../store/borrow.store"

type ApprovalModalProps = {
  handleClose: () => void
}

function ApprovalModal(props: ApprovalModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const collateralAllowance = useBorrow((state) => state.collateral.allowance)
  const collateralInput = useBorrow((state) => state.collateral.input)

  const amount = parseFloat(collateralInput)

  const allow = useBorrow((state) => state.allow)
  const handleAllow = () => allow(amount, props.handleClose)

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
        <CloseIcon
          sx={{ cursor: "pointer", position: "absolute", right: 16, top: 16 }}
          onClick={props.handleClose}
          fontSize="small"
        />

        <Box mt={2}>
          <Image
            src="/assets/images/usdroundicon.png"
            width="60"
            height="60"
            alt="ust icon"
          />
        </Box>

        <Typography variant="h5" mt="2rem">
          Approve spending limit
        </Typography>

        <Typography mt="1rem">
          To avoid having to reapprove for subsequent transactions, you could
          enable infinite approval.
        </Typography>

        <Typography mt="1rem">
          Otherwise, only the exact amount for this transaction will be allowed
          to be transfered from your wallet.
        </Typography>
        <LoadingButton
          variant="gradient"
          size="large"
          fullWidth
          sx={{ mt: "1.5rem" }}
          loading={collateralAllowance.status === "allowing"}
          onClick={handleAllow}
        >
          Approve
        </LoadingButton>
      </Paper>
    </Dialog>
  )
}

export default ApprovalModal
