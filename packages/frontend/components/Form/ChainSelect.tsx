import React, {
  useState,
} from "react"
import {
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import { chains } from "../../machines/auth.machine"

type Chain = typeof chains[0]

export default function ChainSelect() {
  const [
    chainId,
    setChainId,
  ] = useState(
    chains[0]
      .id
  )

  return (
    <Select
      labelId="chain-label"
      id="chain"
      value={
        chainId
      }
      variant="outlined"
      IconComponent={
        KeyboardArrowDownIcon
      }
      onChange={e =>
        setChainId(
          e
            .target
            .value
        )
      }
    >
      {chains.map(
        (
          chain: Chain
        ) => (
          <MenuItem
            key={
              chain.id
            }
            value={
              chain.id
            }
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
              }}
            >
              <Image
                src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                height={
                  20
                }
                width={
                  20
                }
                alt={
                  chain.label
                }
              />
              <Typography
                variant="body"
                sx={{
                  ml:
                    "0.5rem",
                }}
              >
                {
                  chain.label
                }
              </Typography>
            </div>
          </MenuItem>
        )
      )}
    </Select>
  )
}
