import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"
import { ElementType, useState } from "react"
import Image from "next/image"

type TransactionProcessingModalProps = {
  open: boolean
  handleClose: (e: {}) => void
}

const steps = [
  {
    label: "Deposit 1 ETH on Aave",
    description: "Ethereum Network",
  },
  {
    label: "Validate Transaction",
    description: "Connext bridge",
  },
  {
    label: "Borrow 900 USDC from Aave",
    description: "Polygon Network",
  },
]

/* const icons: { [index: string]: ElementType<any> | undefined } = {
  1: (
    <Image
      src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
      height={32}
      width={32}
      alt="Ethereum"
    />
  ),
  2: (
    <Image
      src={`/assets/images/logo/Connext.svg`}
      height={32}
      width={32}
      alt="Connext"
    />
  ),
  3: (
    <Image
      src={`/assets/images/protocol-icons/networks/Polygon.svg`}
      height={32}
      width={32}
      alt="Polygon"
    />
  ),
} */

export default function TransactionProcessingModal(
  props: TransactionProcessingModalProps
) {
  const { palette } = useTheme()
  const [activeStep, setActiveStep] = useState(0)

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1)

  const handleBack = () => setActiveStep((prevActiveStep) => prevActiveStep - 1)

  const handleReset = () => setActiveStep(0)

  return (
    <Dialog
      open={props.open}
      onClose={props.handleClose}
      sx={{ ".MuiPaper-root": { background: "transparent" } }}
    >
      <Box
        sx={{
          background: palette.secondary.contrastText,
          border: `1px solid ${palette.secondary.light}`,
          borderRadius: "1.125rem",
          padding: "1.5rem",
          color: palette.text.primary,
        }}
      >
        <CloseIcon
          sx={{
            cursor: "pointer",
            float: "right",
          }}
          onClick={props.handleClose}
          fontSize="small"
        />
        <Box sx={{ textAlign: "center", mt: "1.625rem", mb: "2.688rem" }}>
          <Typography variant="h6">Transaction processing</Typography>
          <Typography variant="body">Borrowing on Polygon Network</Typography>
        </Box>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, i) => (
              <Step key={step.label}>
                <StepLabel /* StepIconComponent={icons[i]} */>
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography>{step.description}</Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Box>
    </Dialog>
  )
}
