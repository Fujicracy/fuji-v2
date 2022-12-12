import React, { MouseEvent, ReactElement, useState } from "react"
import {
  Card,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  SxProps,
  TextField,
  Typography,
  useTheme,
  Theme,
  ButtonBase,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"

import { Token } from "@x-fuji/sdk"
import styles from "../../styles/components/Borrow.module.css"
import Balance from "../Balance"
import { useStore } from "../../store"
import { DEFAULT_LTV_RECOMMENDED } from "../../consts/borrow"
import TokenIcon from "../TokenIcon"

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
  const ltv = useStore((state) => state.position.ltv)
  const ltvMax = useStore((state) => state.position.ltvMax)

  const isBorrowing = useStore((state) => state.isBorrowing)

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
          disabled={isBorrowing}
          onChange={(e) => handleInput(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
        />
        <ButtonBase
          id={`select-${type}-button`}
          disabled={isBorrowing}
          onClick={open}
        >
          {token && (
            <TokenItem
              token={token}
              prepend={<KeyboardArrowDownIcon />}
              sx={{ borderRadius: "2rem" }}
            />
          )}
        </ButtonBase>
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

      <div className={styles.cardLine} style={{ marginTop: "1rem" }}>
        {type === "collateral" ? (
          <>
            <Typography variant="small" sx={{ width: "11rem" }}>
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
                mr="0.4rem"
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
                <Balance balance={balance} dataCy="balance-amount" />
              </Typography>
            </div>
          </>
        ) : (
          <>
            <Typography variant="small" sx={{ width: "7rem" }}>
              {(tokenValue * +value).toLocaleString("en-US", {
                style: "currency",
                currency: "usd",
              })}
            </Typography>

            <Stack direction="row">
              <Typography
                variant="smallDark"
                color={
                  !ltv
                    ? ""
                    : ltv > ltvMax
                    ? palette.error.main
                    : ltv > DEFAULT_LTV_RECOMMENDED // TODO: should this be dynamic ?
                    ? palette.warning.main
                    : palette.success.main
                }
                mr=".5rem"
              >
                LTV {ltv <= 100 ? `${ltv}%` : "n/a"}
              </Typography>
              <Typography variant="smallDark">
                (Recommended: {DEFAULT_LTV_RECOMMENDED}%)
              </Typography>
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
  sx?: SxProps<Theme>
  onClick?: (token: Token) => void
}
const TokenItem = (props: TokenItem) => {
  const { token, balance, prepend, sx, onClick } = props

  return (
    <MenuItem
      key={token.name}
      value={token.symbol}
      onClick={() => onClick && onClick(token)}
      sx={sx}
    >
      <ListItemIcon>
        <TokenIcon token={token} height={24} width={24} />
      </ListItemIcon>
      <ListItemText>
        <Typography variant="h6">{token.symbol}</Typography>
      </ListItemText>
      {typeof balance === "number" && (
        <Typography variant="smallDark" ml="3rem">
          <Balance balance={balance} />
        </Typography>
      )}
      {prepend}
    </MenuItem>
  )
}
