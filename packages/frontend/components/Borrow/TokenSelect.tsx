import React, { MouseEvent, ReactElement, useState } from "react"
import {
  Box,
  Card,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import { Token } from "@x-fuji/sdk"
import styles from "../../styles/components/Borrow.module.css"
import Balance from "../Balance"
import { useStore } from "../../store"

type SelectTokenCardProps = {
  type: "collateral" | "borrow"
}

export default function TokenSelect(props: SelectTokenCardProps) {
  const { palette } = useTheme()
  const { type } = props
  const changeCollateralToken = useStore((state) => state.changeCollateralToken)
  const borrowOrCollateral = useStore((state) => state[type])
  const { value, balance } = borrowOrCollateral

  const collateralOrBorrow = useStore((state) => state[type])
  const { token, balances } = collateralOrBorrow

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const close = () => setAnchorEl(null)

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor:
          type === "collateral" &&
          collateralOrBorrow.value > collateralOrBorrow?.balance
            ? palette.error.dark
            : palette.secondary.light,
      }}
    >
      <div className={styles.cardLine}>
        <TextField
          id="collateral-amount"
          type="number"
          placeholder="0"
          value={collateralOrBorrow.value}
          onChange={() => alert("not implemented")}
          sx={{
            fontSize: "1.125rem",
            boxShadow: "none",
            ".MuiOutlinedInput-notchedOutline": { border: 0 },
            width: "40%",
          }}
        />

        <Box
          id={`select-${type}-button`}
          onClick={open}
          display="flex"
          alignItems="center"
        >
          {token && (
            <ChainItem token={token} prepend={<KeyboardArrowDownIcon />} />
          )}
        </Box>

        <Menu
          id="collateral-token"
          anchorEl={anchorEl}
          open={isOpen}
          onClose={close}
          TransitionComponent={Fade}
        >
          {collateralOrBorrow.tokens.map((token, index) => (
            <ChainItem
              key={token.name}
              token={token}
              balance={
                type === "collateral" && balances ? balances[index] : undefined
              }
              onClick={() => changeCollateralToken(token)}
            />
          ))}
        </Menu>
      </div>
      <div className={styles.cardLine}>
        {type === "collateral" ? (
          <>
            <Typography variant="small">$0.00</Typography>
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography
                variant="xsmall"
                align="center"
                className={styles.maxBtn}
                onClick={() => alert("not implemented")}
              >
                MAX
              </Typography>

              <Typography variant="smallDark">Balance: </Typography>
              <Typography
                ml=".25rem"
                color={
                  value > balance ? palette.error.dark : palette.text.primary
                }
              >
                <Balance balance={balance} token={token} />
              </Typography>
            </div>
          </>
        ) : (
          <>
            <Typography variant="small">$0.00</Typography>
            <Typography variant="smallDark">
              LTV 45% (Recommended): n/a
            </Typography>
          </>
        )}
      </div>
    </Card>
  )
}

type ChainItemProps = {
  token: Token
  balance?: number
  prepend?: ReactElement
  onClick?: (token: Token) => void
}
const ChainItem = (props: ChainItemProps) => {
  const { token, balance, prepend, onClick } = props

  return (
    <MenuItem
      key={token.name}
      value={token.symbol}
      onClick={() => onClick && onClick(token)}
    >
      <ListItemIcon>
        <Image
          src={`/assets/images/protocol-icons/tokens/${token.symbol}.svg`}
          height={24}
          width={24}
          alt={token.name}
        />
      </ListItemIcon>
      <ListItemText>
        <Typography variant="h6">{token.symbol}</Typography>
      </ListItemText>
      {balance && (
        <Typography variant="smallDark" ml="3rem">
          <Balance balance={balance} token={token} />
        </Typography>
      )}
      {prepend}
    </MenuItem>
  )
}
