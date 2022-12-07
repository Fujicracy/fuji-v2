import React from "react"
import { ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material"

import { chains } from "../../store/auth.slice"
import NetworkIcon from "../NetworkIcon"

type Chain = typeof chains[0]

type CollateralDropdownProps = {
  chains: Chain[]
}

export default function CollateralDropdown(props: CollateralDropdownProps) {
  return (
    <>
      {props.chains.map((chain: Chain) => (
        <MenuItem key={chain.id} value={chain.id}>
          <ListItemIcon>
            <NetworkIcon network={chain.label} height={20} width={20} />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body">{chain.label}</Typography>
          </ListItemText>
        </MenuItem>
      ))}
    </>
  )
}
