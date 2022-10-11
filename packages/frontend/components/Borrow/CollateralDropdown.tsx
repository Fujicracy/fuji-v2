import React from "react"
import { ListItemIcon, ListItemText, MenuItem, Typography } from "@mui/material"

import { chains } from "../../store"
import Image from "next/image"

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
            <Image
              src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
              height={20}
              width={20}
              alt={chain.label}
            />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body">{chain.label}</Typography>
          </ListItemText>
        </MenuItem>
      ))}
    </>
  )
}
