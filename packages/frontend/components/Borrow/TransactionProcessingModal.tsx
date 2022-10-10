import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { StepIconProps } from "@mui/material/StepIcon"
import CloseIcon from "@mui/icons-material/Close"
import LaunchIcon from "@mui/icons-material/Launch"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import Image from "next/image"

type Step = {
  label: string
  description: string
  link: string | undefined
  status: string
}

type TransactionProcessingModalProps = {
  open: boolean
  handleClose: (e: {}) => void
}

const steps: Step[] = [
  {
    label: "Deposit 1 ETH on Aave",
    description: "Ethereum Network",
    link: "https://ethereum.org/fr/",
    status: "done",
  },
  {
    label: "Validate Transaction",
    description: "Connext bridge",
    link: "https://www.connext.network/",
    status: "done",
  },
  {
    label: "Borrow 900 USDC from Aave",
    description: "Polygon Network",
    link: undefined,
    status: "pending",
  },
]

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
            {steps.map((step) => (
              <Step key={step.label}>
                <Grid
                  container
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Grid item>
                    <StepLabel StepIconComponent={CustomStepIcon}>
                      <Typography variant="body">{step.label}</Typography>
                      <br />
                      <a href={step.link} target="_blank" rel="noreferrer">
                        <Typography variant="smallDark">
                          {step.description}
                        </Typography>
                        {step.link && (
                          <LaunchIcon
                            sx={{
                              ml: "0.3rem",
                              fontSize: "0.6rem",
                              color: palette.info.dark,
                            }}
                          />
                        )}
                      </a>
                    </StepLabel>
                  </Grid>
                  <Grid item>
                    <CheckCircleIcon
                      sx={{
                        color: palette.success.dark,
                        borderRadius: "100%",
                        padding: 0,
                      }}
                      fontSize="large"
                      color="disabled"
                    />
                  </Grid>
                </Grid>
              </Step>
            ))}
          </Stepper>
          <Card
            variant="outlined"
            sx={{ p: 0, textAlign: "center", mt: "2.5rem" }}
          >
            <CardContent>
              <Typography variant="small">
                This step takes a few minutes to process. If you close this
                window, your transaction will still be processed.
              </Typography>
            </CardContent>
          </Card>
        </DialogContent>
      </Box>
    </Dialog>
  )
}

function CustomStepIcon(props: StepIconProps) {
  const { palette } = useTheme()

  const icons: { [index: string]: React.ReactElement } = {
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
  }

  return (
    <Box
      sx={{
        mr: "0.5rem",
        background: palette.secondary.dark,
        p: "0.5rem",
        borderRadius: "100%",
      }}
    >
      {icons[String(props.icon)]}
    </Box>
  )
}
