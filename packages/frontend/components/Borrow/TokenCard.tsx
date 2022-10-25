import React, { MouseEvent, ReactElement, useState } from "react"
import {
  Box,
  Card,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
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
import { useTvl } from "../../store/transaction.slice"

type SelectTokenCardProps = {
  type: "collateral" | "borrow"
}

export default function TokenCard({ type }: SelectTokenCardProps) {
  const { palette } = useTheme()
  const changeCollateralToken = useStore((state) => state.changeCollateralToken)
  const changeBorrowToken = useStore((state) => state.changeBorrowToken)
  const changeBorrowValue = useStore((state) => state.changeBorrowValue)
  const changeCollateralValue = useStore((state) => state.changeCollateralValue)
  const borrowOrCollateral = useStore((state) => state[type])
  const { value, balance, token, tokenValue, tokens, balances } =
    borrowOrCollateral

  const tvl = useTvl()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const close = () => setAnchorEl(null)

  const handleClick = (token: Token) => {
    if (type === "borrow") {
      changeBorrowToken(token)
    } else if (type === "collateral") {
      changeCollateralToken(token)
    }
    close()
  }

  const handleMax = () => {
    handleInput(balance.toString())
  }

  const handleInput = (val: string) => {
    if (type === "borrow") {
      changeBorrowValue(val)
    } else if (type === "collateral") {
      changeCollateralValue(val)
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor:
          type === "collateral" && value > balance
            ? palette.error.dark
            : palette.secondary.light,
      }}
    >
      <div className={styles.cardLine}>
        <TextField
          id="collateral-amount"
          type="number"
          placeholder="0"
          value={String(value)}
          onChange={(e) => handleInput(e.target.value)}
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
            <TokenItem token={token} prepend={<KeyboardArrowDownIcon />} />
          )}
        </Box>

        <Menu
          id="collateral-token"
          anchorEl={anchorEl}
          open={isOpen}
          onClose={close}
          TransitionComponent={Fade}
        >
          {tokens.map((token, index) => (
            <TokenItem
              key={token.name}
              token={token}
              balance={
                type === "collateral" && balances ? balances[index] : undefined
              }
              onClick={() => handleClick(token)}
            />
          ))}
        </Menu>
      </div>
      <div className={styles.cardLine}>
        {type === "collateral" ? (
          <>
            <Typography variant="small">
              ${value ? (tokenValue * value).toLocaleString() : 0}
            </Typography>
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
                onClick={handleMax}
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
            <Typography variant="small">
              ${value ? (tokenValue * value).toLocaleString() : 0}
            </Typography>
            <Stack direction="row">
              {/* TODO: handle third case: tvl error */}
              <Typography
                variant="smallDark"
                color={tvl > 55 ? palette.warning.main : palette.success.main}
                mr=".5rem"
              >
                LTV {tvl}%
              </Typography>
              <Typography variant="smallDark">(Recommended: 55%)</Typography>
            </Stack>
          </>
        )}
      </div>
    </Card>
  )
}

type TokenItem = {
  token: Token
  balance?: number
  prepend?: ReactElement
  onClick?: (token: Token) => void
}
const TokenItem = (props: TokenItem) => {
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
