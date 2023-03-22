import React from "react"
import { ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material"

import { chains } from "../../helpers/chains"
import { NetworkIcon } from "../Shared/Icons"

type Chain = (typeof chains)[0]

type CollateralDropdownProps = {
  chains: Chain[]
}

function CollateralDropdown({ chains }: CollateralDropdownProps) {
  return (
    <>
      {chains.map((chain: Chain) => {
        return (
          <MenuItem key={chain.chainId} value={chain.chainId}>
            <ListItemIcon>
              <NetworkIcon network={chain.name} height={20} width={20} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body">{chain.name}</Typography>
            </ListItemText>
          </MenuItem>
        )
      })}
    </>
  )
}

export default CollateralDropdown
