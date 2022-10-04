import React, { useState } from "react"
import { Chip, Grid, Menu, Typography } from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import { chains } from "../../machines/auth.machine"

type Chain = typeof chains[0]

type ChainSelectProps = {
  minified: boolean
  selectedChain: Chain
}

export default function ChainSelect(props: ChainSelectProps) {
  const [chainId, setChainId] = useState(chains[0].id)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  return (
    <>
      {/* <Select
      labelId="chain-label"
      id="chain"
      value={chainId}
      variant="outlined"
      sx={{ p: "0.438rem, 0.75rem" }}
      IconComponent={() => (
        <KeyboardArrowDownIcon sx={{ display: { xs: "none", sm: "block" } }} />
      )}
      onChange={e => setChainId(e.target.value)}
    > */}
      <Chip
        label={
          <Grid container alignItems="center">
            <Image
              src={`/assets/images/protocol-icons/networks/${props.selectedChain.label}.svg`}
              height={20}
              width={20}
              alt={props.selectedChain.label}
            />
            {!props.minified && (
              <Typography variant="small" sx={{ marginLeft: "0.5rem" }}>
                {props.selectedChain.label}
              </Typography>
            )}
          </Grid>
        }
        component="button"
        deleteIcon={!props.minified ? <KeyboardArrowDownIcon /> : <></>}
        onClick={openMenu}
        onDelete={openMenu}
      />
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        Test
      </Menu>
      {/* {chains.map((chain: Chain) => (
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
            {!props.minified && (
              <Typography
                variant="body"
                sx={{
                  ml: "0.5rem",
                }}
              >
                {chain.label}
              </Typography>
            )}
          </div>
        </MenuItem>
      ))} */}
      {/* </Select> */}
    </>
  )
}
