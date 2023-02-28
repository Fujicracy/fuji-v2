import React from "react"
import {
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"

import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import CheckIcon from "@mui/icons-material/Check"

import { useAuth } from "../../store/auth.store"
import { chains, chainName } from "../../helpers/chains"
import { NetworkIcon } from "./Icons"

export default function ChainSelect() {
  const theme = useTheme()
  const onMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [chainId, setChainId] = useAuth((state) => [
    state.chain?.id,
    state.changeChain,
  ])
  const networkName = chainName(chainId)

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget)
  }
  const selectChain = (chainId: string) => {
    setChainId(chainId)
    setAnchorEl(null)
  }

  return (
    <>
      {networkName ? (
        <Chip
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <ListItem
                chainName={networkName}
                selected={false}
                onMobile={onMobile}
              />
              {!onMobile && (
                <KeyboardArrowDownIcon sx={{ ml: "0px !important" }} />
              )}
            </Stack>
          }
          onClick={openMenu}
        />
      ) : (
        <Chip
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon fontSize="inherit" />
              <Typography fontSize="inherit">Switch network</Typography>
              <KeyboardArrowDownIcon sx={{ ml: "0px !important" }} />
            </Stack>
          }
          onClick={openMenu}
          color="error"
        />
      )}
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ "aria-labelledby": "basic-button" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 1 }}
        PaperProps={{
          sx: { background: theme.palette.secondary.contrastText },
        }}
      >
        {chains.map((chain) => (
          <MenuItem key={chain.id} onClick={() => selectChain(chain.id)}>
            <ListItem
              chainName={chainName(chain.id)}
              selected={chainId === chain.id}
              onMobile={false}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

type ListItemProps = { chainName: string; selected: boolean; onMobile: boolean }

const ListItem = (props: ListItemProps) => {
  const { chainName, selected, onMobile } = props
  const { palette } = useTheme()

  return (
    <>
      <ListItemIcon sx={{ minWidth: "inherit" }}>
        <NetworkIcon network={chainName} height={20} width={20} />
      </ListItemIcon>
      {!onMobile && (
        <ListItemText sx={{ fontSize: "0.875rem" }}>{chainName}</ListItemText>
      )}

      {selected && (
        <CheckIcon sx={{ color: palette.text.primary, ml: "2rem" }} />
      )}
    </>
  )
}
