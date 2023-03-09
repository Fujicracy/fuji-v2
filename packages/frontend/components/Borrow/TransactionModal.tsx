import { useState } from "react"
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  Link,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from "@mui/material"
import { useTheme, styled } from "@mui/material/styles"
import StepConnector, {
  stepConnectorClasses,
} from "@mui/material/StepConnector"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import CloseIcon from "@mui/icons-material/Close"
import LaunchIcon from "@mui/icons-material/Launch"
import CheckIcon from "@mui/icons-material/Check"
import Image from "next/image"
import { RoutingStep } from "@x-fuji/sdk"

import { NetworkIcon } from "../Shared/Icons"
import { HistoryEntryStatus, useHistory } from "../../store/history.store"
import { formatUnits } from "ethers/lib/utils"
import { chainName } from "../../helpers/chains"
import { transactionLink } from "../../helpers/transaction"
import { useAuth } from "../../store/auth.store"
import AddTokenButton from "../Shared/AddTokenButton"
import { showPosition } from "../../helpers/navigation"
import { useRouter } from "next/router"
import { vaultFromAddress } from "../../helpers/positions"

type InvalidStep = {
  label: "Invalid"
}
type ValidStep = {
  label: string
  description: string
  chainId: number
  txHash?: string
  link?: string
  icon: () => JSX.Element
}
type TransactionStep = InvalidStep | ValidStep

type TransactionModalProps = {
  hash?: string
}
function TransactionModal({ hash }: TransactionModalProps) {
  const theme = useTheme()
  const router = useRouter()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [activeStep] = useState(2)

  const activeChainId = useAuth((state) => parseInt(state.chain?.id || ""))
  const entry = useHistory((state) => state.byHash[hash || ""])
  const closeModal = useHistory((state) => state.closeModal)

  const action =
    entry?.steps.find((s) => s.step === RoutingStep.BORROW) ||
    entry?.steps.find((s) => s.step === RoutingStep.WITHDRAW)

  const connextScanLink = entry?.connextTransferId
    ? `https://amarok.connextscan.io/tx/${entry.connextTransferId}`
    : ""

  if (!entry) {
    return <></>
  }

  const onClick = () => {
    closeModal()
    const vault = vaultFromAddress(entry.vaultAddr)
    if (!vault) {
      router.push("/my-positions")
      return
    }
    showPosition(router, undefined, vault)
  }

  const steps = entry.steps
    .map((s): TransactionStep => {
      const { step, txHash, chainId, token, lendingProvider } = s
      const amount = formatUnits(s.amount ?? 0, token.decimals)
      const provider = lendingProvider?.name
      const chain = chainName(chainId)
      const link = txHash && transactionLink(chainId, txHash)

      const style = {
        background: theme.palette.secondary.light,
        mr: "0.5rem",
        p: "0.5rem 0.5rem 0.3rem 0.5rem",
        borderRadius: "100%",
        zIndex: 1,
      }

      const label =
        step === RoutingStep.DEPOSIT
          ? `Deposit ${amount} ${token.symbol} on ${provider}`
          : step === RoutingStep.BORROW
          ? `Borrow ${amount} ${token.symbol} from ${provider}`
          : step === RoutingStep.WITHDRAW
          ? `Withdraw ${amount} ${token.symbol} from ${provider}`
          : step === RoutingStep.PAYBACK
          ? `Repay ${amount} ${token.symbol} from ${provider}`
          : step === RoutingStep.X_TRANSFER
          ? `Bridge ${amount} ${token.symbol} to ${chain}`
          : "Invalid"

      const icon =
        step === RoutingStep.X_TRANSFER ? (
          <Image
            src="/assets/images/logo/connext.svg"
            height={32}
            width={32}
            alt="Connext"
          />
        ) : (
          <NetworkIcon network={chain} height={32} width={32} />
        )

      return {
        label,
        chainId,
        txHash,
        link: step === RoutingStep.X_TRANSFER ? connextScanLink : link,
        description:
          step === RoutingStep.X_TRANSFER ? "Connext" : `${chain} Network`,
        icon: () => <Box sx={style}>{icon}</Box>,
      }
    })
    // remove "START" and "END"
    .filter((s) => s.label !== "Invalid") as ValidStep[]

  return (
    <Dialog
      open={Boolean(hash)}
      onClose={closeModal}
      sx={{
        ".MuiPaper-root": { width: isMobile ? "100%" : "430px" },
        backdropFilter: { xs: "blur(0.313rem)", sm: "none" },
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: "1rem", sm: "1.5rem" } }}>
        <CloseIcon
          sx={{ cursor: "pointer", float: "right" }}
          onClick={closeModal}
          fontSize="small"
        />
        <Box textAlign="center" mt="1.625rem" mb="2.5rem">
          <Typography variant="h6">
            Transaction{" "}
            {entry.status === HistoryEntryStatus.ONGOING && "processing..."}
            {entry.status === HistoryEntryStatus.DONE && "succeeded"}
            {entry.status === HistoryEntryStatus.ERROR && "error"}
          </Typography>
        </Box>
        <DialogContent>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            connector={<CustomConnector />}
          >
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel StepIconComponent={step.icon}>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="body">{step.label}</Typography>
                      <br />
                      {step.txHash && (
                        <Link
                          href={step.link}
                          target="_blank"
                          variant="smallDark"
                        >
                          {step.description}
                          <LaunchIcon
                            sx={{
                              ml: "0.3rem",
                              fontSize: "0.6rem",
                              color: theme.palette.info.dark,
                            }}
                          />
                        </Link>
                      )}
                    </Box>
                    <Box>
                      {step.txHash ||
                      entry.status === HistoryEntryStatus.DONE ? (
                        <CheckIcon
                          sx={{
                            backgroundColor: theme.palette.success.dark,
                            borderRadius: "100%",
                            padding: "0.4rem",
                          }}
                          fontSize="large"
                        />
                      ) : entry.status === HistoryEntryStatus.ONGOING ? (
                        <CircularProgress size={32} />
                      ) : (
                        <ErrorOutlineIcon />
                      )}
                    </Box>
                  </Stack>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        {entry.status === HistoryEntryStatus.ONGOING && (
          <Card variant="outlined" sx={{ mt: 3, maxWidth: "100%" }}>
            <Typography variant="small" textAlign="center">
              This step takes a few minutes to process. If you close this
              window, your transaction will still be processed.
            </Typography>
          </Card>
        )}
        {entry.status === HistoryEntryStatus.DONE && (
          <Stack sx={{ mt: "2rem" }} spacing={1}>
            {action?.token?.chainId === activeChainId && (
              <Box mb="2rem" textAlign="center">
                <AddTokenButton token={action.token} />
              </Box>
            )}
            <Button fullWidth variant="gradient" size="large" onClick={onClick}>
              View Position
            </Button>
            <Link href={connextScanLink} target="_blank" variant="inherit">
              <Button fullWidth variant="ghost">
                Transaction details
              </Button>
            </Link>
          </Stack>
        )}
        {/* TODO: in case of error ??? */}
      </Paper>
    </Dialog>
  )
}

export default TransactionModal

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.secondary.light,
    borderLeft: `0.125rem solid ${theme.palette.secondary.light}`,
    left: "12px",
    position: "relative",
    marginTop: "-2rem",
    height: "6rem",
    marginBottom: "-2rem",
    width: "fit-content",
  },
}))
