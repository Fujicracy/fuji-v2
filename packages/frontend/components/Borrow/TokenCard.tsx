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
import { useLtv } from "../../store/transaction.slice"

type SelectTokenCardProps = {
  type: "collateral" | "debt"
}

export default function TokenCard({ type }: SelectTokenCardProps) {
  const { palette } = useTheme()

  const changeCollateralToken = useStore((state) => state.changeCollateralToken)
  const changeBorrowToken = useStore((state) => state.changeBorrowToken)
  const changeBorrowValue = useStore((state) => state.changeBorrowValue)
  const changeCollateralValue = useStore((state) => state.changeCollateralValue)

  const tokens = useStore((state) =>
    type === "debt" ? state.debtTokens : state.collateralTokens
  )
  const debtOrCollateral = useStore((state) => state.position[type])
  const { token } = debtOrCollateral
  const tokenValue = debtOrCollateral.usdValue
  const balances = useStore((state) =>
    type === "debt" ? state.debtBalances : state.collateralBalances
  )
  const balance = balances[token.symbol]
  const value = useStore((state) =>
    type === "debt" ? state.debtInput : state.collateralInput
  )
  const ltv = useLtv()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const close = () => setAnchorEl(null)

  const handleClick = (token: Token) => {
    if (type === "debt") {
      changeBorrowToken(token)
    } else if (type === "collateral") {
      changeCollateralToken(token)
    }
    close()
  }

  const handleMax = () => {
    handleInput(balance ? balance.toString() : "0")
  }

  const handleInput = (val: string) => {
    if (type === "debt") {
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
          type === "collateral" && debtOrCollateral.amount > balance
            ? palette.error.dark
            : palette.secondary.light,
      }}
    >
      <div className={styles.cardLine}>
        <TextField
          id="collateral-amount"
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          sx={{
            fontSize: "1.125rem",
            boxShadow: "none",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
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
          id={`${type}-token`}
          anchorEl={anchorEl}
          open={isOpen}
          onClose={close}
          TransitionComponent={Fade}
        >
          {tokens.map((token) => (
            <TokenItem
              key={token.name}
              token={token}
              balance={balances[token.symbol]}
              onClick={() => handleClick(token)}
            />
          ))}
        </Menu>
      </div>
      <div className={styles.cardLine}>
        {type === "collateral" ? (
          <>
            <Typography variant="small">
              {(tokenValue * +value).toLocaleString("en-US", {
                style: "currency",
                currency: "usd",
              })}
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
                data-cy="max-btn"
              >
                MAX
              </Typography>

              <Typography variant="smallDark">Balance: </Typography>
              <Typography
                ml=".25rem"
                color={
                  +value > balance ? palette.error.dark : palette.text.primary
                }
              >
                <Balance
                  balance={balance}
                  token={token}
                  dataCy="balance-amount"
                />
              </Typography>
            </div>
          </>
        ) : (
          <>
            <Typography variant="small">
              {(tokenValue * +value).toLocaleString("en-US", {
                style: "currency",
                currency: "usd",
              })}
            </Typography>
            <Stack direction="row">
              {/* TODO: handle third case: tvl error */}
              <Typography
                variant="smallDark"
                color={
                  ltv
                    ? ltv > 55
                      ? palette.warning.main
                      : palette.success.main
                    : ""
                }
                mr=".5rem"
              >
                LTV {ltv}%
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
      {typeof balance === "number" && (
        <Typography variant="smallDark" ml="3rem">
          <Balance balance={balance} token={token} />
        </Typography>
      )}
      {prepend}
    </MenuItem>
  )
}
