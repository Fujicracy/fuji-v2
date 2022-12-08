import { SyntheticEvent, useState } from "react"
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import LaunchIcon from "@mui/icons-material/Launch"
import CircleIcon from "@mui/icons-material/Circle"
import CheckIcon from "@mui/icons-material/Check"
import { formatUnits } from "ethers/lib/utils"
import { RoutingStep } from "@x-fuji/sdk"

import { useStore } from "../../store"
import {
  HistoryEntry,
  useHistory,
  HistoryRoutingStep,
} from "../../store/history.store"
import { chainName } from "../../helpers/chainName"

type AccountModalProps = {
  isOpen: boolean
  anchorEl: HTMLElement
  address: string
  closeAccountModal: () => void
}

export default function AccountModal(props: AccountModalProps) {
  const { palette } = useTheme()
  const logout = useStore((state) => state.logout)
  const walletName = useStore((state) => state.walletName)
  const [showSnackbar, setShowSnackbar] = useState(false)

  const historyEntries = useHistory((state) =>
    state.allHash.map((hash) => state.byHash[hash]).slice(0, 3)
  )
  const openModal = useHistory((state) => state.openModal)

  const addr = props.address
  const formattedAddress =
    addr.substring(0, 5) + "..." + addr.substring(addr.length - 4)

  const copy = () => {
    navigator.clipboard.writeText(addr)
    setShowSnackbar(true)
  }

  const handleClose = (
    _: Event | SyntheticEvent<Element, Event>,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return
    }
    setShowSnackbar(false)
  }

  return (
    <Popover
      open={props.isOpen}
      onClose={() => props.closeAccountModal()}
      anchorEl={props.anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      PaperProps={{
        sx: { maxWidth: "340px", background: "transparent" },
      }}
    >
      <Card
        sx={{
          border: `1px solid ${palette.secondary.light}`,
          mt: "1.5rem",
        }}
      >
        <CardContent sx={{ position: "relative", width: "100%" }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="xsmall">
              Connected with {walletName}
            </Typography>
            <Button variant="small" onClick={logout}>
              Disconnect
            </Button>
          </Stack>

          <Grid container alignItems="center">
            <CircleIcon />
            <Typography variant="h5" m="0.625rem 0 0.625rem 0.5rem">
              {formattedAddress}
            </Typography>
          </Grid>

          <Grid container alignItems="center">
            <Grid item>
              <Grid
                container
                alignItems="center"
                sx={{ cursor: "pointer" }}
                onClick={copy}
              >
                <ContentCopyIcon
                  fontSize="small"
                  sx={{ color: palette.primary.main, mr: "0.438rem" }}
                />
                <Typography variant="small" color={palette.primary.main}>
                  Copy Address
                </Typography>
                <Snackbar
                  open={showSnackbar}
                  autoHideDuration={2000}
                  onClose={handleClose}
                >
                  <Alert
                    onClose={handleClose}
                    severity="success"
                    sx={{ color: palette.success.main }}
                  >
                    Address copied!
                  </Alert>
                </Snackbar>
              </Grid>
            </Grid>
            <Grid item>
              <a
                href={"https://etherscan.io/address/" + props.address} // TODO: This link only work on mainnet. Make it work with any scanner
                target="_blank" // TODO: target='_blank' doesn't work with NextJS "<Link>"...
                rel="noreferrer"
              >
                <Grid container alignItems="center">
                  <>
                    <LaunchIcon
                      fontSize="small"
                      sx={{
                        color: palette.info.dark,
                        ml: "1.188rem",
                        mr: "0.438rem",
                      }}
                    />
                    <Typography variant="small" color={palette.info.dark}>
                      View on Explorer
                    </Typography>
                  </>
                </Grid>
              </a>
            </Grid>
          </Grid>
          <Grid
            container
            justifyContent="space-between"
            p="1.5rem 1.5rem 0 1.5rem"
          >
            <Typography variant="body">Recent Transactions</Typography>
            <Typography variant="small">clear all</Typography>
          </Grid>
          <List>
            {historyEntries?.length ? (
              historyEntries.map((e) => (
                <BorrowEntry
                  key={e.hash}
                  entry={e}
                  onClick={() => openModal(e.hash)}
                />
              ))
            ) : (
              <ListItem sx={{ p: "0 1.5rem 1rem" }}>
                <Typography variant="small">
                  Nothing here... What are you waiting for ?
                </Typography>
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Popover>
  )
}

type BorrowEntryProps = {
  entry: HistoryEntry
  onClick: () => void
}
function BorrowEntry({ entry, onClick }: BorrowEntryProps) {
  const collateral = entry.steps.find(
    (s) => s.step === RoutingStep.DEPOSIT
  ) as HistoryRoutingStep
  const debt = entry.steps.find(
    (s) => s.step === RoutingStep.BORROW
  ) as HistoryRoutingStep

  const { palette } = useTheme()

  const listAction =
    entry.status === "ongoing" ? (
      <CircularProgress size={16} />
    ) : (
      <CheckIcon
        sx={{
          background: `${palette.success.main}1A`,
          color: palette.success.dark,
          borderRadius: "100%",
          p: "0.25rem",
        }}
      />
    )

  return (
    <ListItemButton sx={{ p: "0 .5rem" }} onClick={onClick}>
      <ListItem secondaryAction={listAction}>
        <ListItemText>
          <Typography variant="small">
            Deposit {formatUnits(collateral.amount, collateral.token.decimals)}{" "}
            {collateral.token.symbol} and borrow{" "}
            {formatUnits(debt.amount, debt.token.decimals)} {debt.token.symbol}{" "}
            on {chainName(debt.token.chainId)}
          </Typography>
        </ListItemText>
      </ListItem>
    </ListItemButton>
  )
}
