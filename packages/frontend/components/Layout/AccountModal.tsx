import { useState } from "react"
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
  Box,
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
import { transactionAddress } from "../../helpers/transactionInformations"

type AccountModalProps = {
  isOpen: boolean
  anchorEl: HTMLElement
  address: string
  closeAccountModal: () => void
}

export default function AccountModal(props: AccountModalProps) {
  const { palette } = useTheme()
  const [copied, setCopied] = useState(false)
  const [copyAddressHovered, setCopyAddressHovered] = useState(false)
  const [viewOnExplorerHovered, setViewOnExplorerHovered] = useState(false)
  const logout = useStore((state) => state.logout)
  const walletName = useStore((state) => state.walletName)
  const historyEntries = useHistory((state) =>
    state.allHash.map((hash) => state.byHash[hash]).slice(0, 3)
  )
  const openModal = useHistory((state) => state.openModal)
  const clearAll = useHistory((state) => state.clearAll)

  const chainId = useStore((state) => state.chain?.id)

  const formattedAddress =
    props.address.substring(0, 8) +
    "..." +
    props.address.substring(props.address.length - 4)

  const copy = () => {
    navigator.clipboard.writeText(props.address)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 5000)
  }

  return (
    <Popover
      open={props.isOpen}
      onClose={props.closeAccountModal}
      anchorEl={props.anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{ sx: { background: "transparent", padding: 0 } }}
    >
      <Card sx={{ border: `1px solid ${palette.secondary.light}`, mt: 1 }}>
        <CardContent sx={{ width: "340px", p: 0, pb: "0 !important" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            p="1.5rem 1.25rem 0.625rem 1.25rem"
          >
            <Typography variant="xsmall">
              Connected with {walletName}
            </Typography>
            <Button variant="small" onClick={logout}>
              Disconnect
            </Button>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap=".5rem"
            ml="1.25rem"
            mb=".8rem"
          >
            <CircleIcon sx={{ fontSize: "20px" }} />
            <Typography variant="body">{formattedAddress}</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" gap="1.125rem" ml="1.4rem">
            <Stack
              direction="row"
              alignItems="center"
              sx={{ cursor: "pointer" }}
              onClick={copy}
              onMouseEnter={() => setCopyAddressHovered(true)}
              onMouseLeave={() => setCopyAddressHovered(false)}
            >
              <ContentCopyIcon
                fontSize="small"
                sx={{
                  color: !copyAddressHovered
                    ? palette.info.main
                    : palette.text.primary,
                  mr: ".2rem",
                  fontSize: "1rem",
                }}
              />
              <Typography
                variant="xsmall"
                color={
                  !copyAddressHovered ? palette.info.main : palette.text.primary
                }
              >
                {!copied ? "Copy Address" : "Copied!"}
              </Typography>
            </Stack>

            <Box>
              <a
                href={transactionAddress(chainId, props.address)}
                target="_blank" // TODO: target='_blank' doesn't work with NextJS "<Link>"...
                rel="noreferrer"
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  onMouseEnter={() => setViewOnExplorerHovered(true)}
                  onMouseLeave={() => setViewOnExplorerHovered(false)}
                >
                  <LaunchIcon
                    sx={{
                      color: viewOnExplorerHovered
                        ? palette.text.primary
                        : palette.info.main,
                      mr: ".2rem",
                      fontSize: "1rem",
                    }}
                  />
                  <Typography
                    variant="xsmall"
                    color={
                      viewOnExplorerHovered
                        ? palette.text.primary
                        : palette.info.main
                    }
                  >
                    View on Explorer
                  </Typography>
                </Stack>
              </a>
            </Box>
          </Stack>

          <Divider
            sx={{
              m: "1rem 1.25rem .75rem 1.25rem",
              background: palette.secondary.light,
            }}
          />

          <Stack direction="row" justifyContent="space-between" mx="1.25rem">
            <Typography variant="xsmall">Recent Transactions</Typography>
            {historyEntries.length > 0 &&
              historyEntries.filter((entry) => entry.status === "ongoing")
                .length !== historyEntries.length && (
                <Typography variant="xsmallLink" onClick={clearAll}>
                  clear all
                </Typography>
              )}
          </Stack>

          <List sx={{ pb: ".75rem" }}>
            {historyEntries?.length ? (
              historyEntries.map((e) => (
                <BorrowEntry
                  key={e.hash}
                  entry={e}
                  onClick={() => openModal(e.hash)}
                />
              ))
            ) : (
              <ListItem sx={{ px: "1.25rem" }}>
                <Typography variant="xsmallDark">
                  Your recent transaction history will appear here.
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
      <CircularProgress size={16} sx={{ mr: "-1rem" }} />
    ) : (
      <CheckIcon
        sx={{
          background: `${palette.success.main}1A`,
          color: palette.success.dark,
          borderRadius: "100%",
          fontSize: "20px",
          mr: "-1rem",
        }}
      />
    )

  return (
    <ListItemButton sx={{ px: "1.25rem", py: ".25rem" }} onClick={onClick}>
      <ListItem secondaryAction={listAction} sx={{ p: 0, pr: "3rem" }}>
        <ListItemText sx={{ m: 0 }}>
          <Typography variant="xsmall">
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
