import React, { useState } from "react"
import { Chip, Grid, Menu, Typography } from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { useTheme } from "@mui/material/styles"
import Image from "next/image"

import { chains } from "../../machines/auth.machine"
import CollateralDropdown from "../Borrow/CollateralDropdown"

type Chain = typeof chains[0]

type ChainSelectProps = {
  minified: boolean
  selectedChain: Chain
}

export default function ChainSelect(props: ChainSelectProps) {
  const { palette } = useTheme()
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
        sx={{
          "& .MuiChip-deleteIcon": {
            color: palette.text.primary,
          },
          background: palette.secondary.dark,
        }}
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
        <CollateralDropdown chains={chains} />
      </Menu>
    </>
  )
}
