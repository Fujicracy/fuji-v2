import React from "react"
import { MenuItem, Typography } from "@mui/material"

import { chains } from "../../machines/auth.machine"
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Image
              src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
              height={20}
              width={20}
              alt={chain.label}
            />

            <Typography
              variant="body"
              sx={{
                ml: "0.5rem",
              }}
            >
              {chain.label}
            </Typography>
          </div>
        </MenuItem>
      ))}
    </>
  )
}
