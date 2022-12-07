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
import Fade from "@mui/material/Fade"

import { useStore } from "../../store"
import { chains, Chain } from "../../store/auth.slice"
import NetworkIcon from "../NetworkIcon"

export default function ChainSelect() {
  const theme = useTheme()
  const onMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [chainId, setChainId] = useStore((state) => [
    state.chain?.id,
    state.changeChain,
  ])
  const currentChain = chains.find((c) => c.id === chainId) as Chain | null

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
      {currentChain ? (
        <Chip
          label={
            <Stack direction="row" spacing={1}>
              <ListItem
                chain={currentChain}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        TransitionComponent={Fade}
      >
        {chains.map((chain) => (
          <MenuItem key={chain.id} onClick={() => selectChain(chain.id)}>
            <ListItem
              chain={chain}
              selected={currentChain?.id === chain.id}
              onMobile={false}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

type ListItemProps = { chain: Chain; selected: boolean; onMobile: boolean }

const ListItem = (props: ListItemProps) => {
  const { chain, selected, onMobile } = props
  const { palette } = useTheme()

  return (
    <>
      <ListItemIcon sx={{ minWidth: "inherit" }}>
        <NetworkIcon networkName={`${chain.label}`} height={20} width={20} />
      </ListItemIcon>
      {!onMobile && <ListItemText>{chain.label}</ListItemText>}

      {selected && (
        <CheckIcon sx={{ color: palette.primary.main, ml: "2rem" }} />
      )}
    </>
  )
}
