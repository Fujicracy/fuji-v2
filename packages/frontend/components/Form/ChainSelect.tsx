import React from "react"
import {
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material"
import Image from "next/image"
import Fade from "@mui/material/Fade"

import { useStore, chains, Chain } from "../../store"

export default function ChainSelect() {
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

  console.log({ chains, currentChain })

  return (
    <>
      {currentChain ? (
        <Chip
          label={
            <Stack direction="row" spacing={1}>
              <ListItem chain={currentChain} />
            </Stack>
          }
          onClick={openMenu}
        />
      ) : (
        <Chip label="Unsupported network" onClick={openMenu} color="error" />
      )}
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ "aria-labelledby": "basic-button" }}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        TransitionComponent={Fade}
      >
        {chains.map((chain) => (
          <MenuItem key={chain.id} onClick={() => selectChain(chain.id)}>
            <ListItem chain={chain} />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

type ListItemProps = { chain: Chain }

const ListItem = (props: ListItemProps) => {
  const { chain } = props

  return (
    <>
      <ListItemIcon sx={{ minWidth: "inherit" }}>
        <Image
          src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
          height={20}
          width={20}
          alt={chain.label}
        />
      </ListItemIcon>
      <ListItemText>{chain.label}</ListItemText>
    </>
  )
}
