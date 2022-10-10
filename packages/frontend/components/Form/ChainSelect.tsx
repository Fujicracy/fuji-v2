import React, { useState } from "react"
import { MenuItem, Select, Typography } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import Image from "next/image"

import { chains } from "../../machines/auth.machine"

type Chain = typeof chains[0]

type ChainSelectProps = {
  minified: boolean
  selectedChain: Chain
}

export default function ChainSelect(props: ChainSelectProps) {
  const [chainId, setChainId] = useState(chains[0].id)

  return (
    <Select
      labelId="chain-label"
      id="chain"
      value={chainId}
      variant="outlined"
      IconComponent={CustomExpandMore}
      inputProps={{
        sx: { pr: { xs: "0.25rem !important", sm: "2rem !important" } },
      }}
      sx={{ ".MuiTypography-body": { display: { xs: "none", sm: "inline" } } }}
      displayEmpty
      onChange={(e) => setChainId(e.target.value)}
    >
      {chains.map((chain: Chain) => (
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
            {/* {!props.minified && ( */}
            <Typography
              variant="body"
              sx={{
                ml: "0.5rem",
              }}
            >
              {chain.label}
            </Typography>
            {/* )} */}
          </div>
        </MenuItem>
      ))}
    </Select>
  )
}

const CustomExpandMore = ({ ...rest }) => {
  return (
    <ExpandMoreIcon {...rest} sx={{ display: { xs: "none", sm: "block" } }} />
  )
}
