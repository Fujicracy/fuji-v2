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
import styles from "../../../styles/components/Borrow.module.css"

import Balance from "../../Shared/Balance"
import { TokenIcon } from "../../Shared/Icons"
import { AssetChange, LtvMeta, recommendedLTV } from "../../../helpers/borrow"
import { formatValue } from "../../../helpers/values"

type SelectTokenCardProps = {
  type: "collateral" | "debt"
  assetChange: AssetChange
  isExecuting: boolean
  disabled: boolean
  value: string
  ltvMeta: LtvMeta
  onTokenChange: (token: Token) => void
  onInputChange: (value: string) => void
}

function TokenCard({
  type,
  assetChange,
  isExecuting,
  disabled,
  value,
  ltvMeta,
  onTokenChange,
  onInputChange,
}: SelectTokenCardProps) {
  const { palette } = useTheme()

  const { token, usdPrice, balances, selectableTokens } = assetChange

  const balance = balances[token.symbol]

  const { ltv, ltvMax } = ltvMeta

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const close = () => setAnchorEl(null)

  const handleMax = () => {
    handleInput(balance ? balance.toString() : "0")
  }

  const handleInput = (val: string) => {
    onInputChange(val)
  }

  const handleTokenChange = (token: Token) => {
    onTokenChange(token)
    close()
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor:
          type === "collateral" && assetChange.amount > balance
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
          disabled={isExecuting}
          onChange={(e) => handleInput(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
        />
        <ButtonBase
          id={`select-${type}-button`}
          disabled={isExecuting || disabled}
          onClick={open}
        >
          {token && disabled ? (
            <>
              <TokenIcon token={token} height={24} width={24} />
              <Typography ml={1} variant="h6">
                {token.symbol}
              </Typography>
            </>
          ) : (
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
          {selectableTokens.map((token) => (
            <TokenItem
              key={token.name}
              token={token}
              balance={balances[token.symbol]}
              onClick={() => handleTokenChange(token)}
            />
          ))}
        </Menu>
      </div>

      <div className={styles.cardLine} style={{ marginTop: "1rem" }}>
        {type === "collateral" ? (
          <>
            <Typography variant="small" sx={{ width: "11rem" }}>
              {formatValue(usdPrice * +value, { style: "currency" })}
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
              {formatValue(usdPrice * +value)}
            </Typography>

            <Stack direction="row">
              <Typography
                variant="smallDark"
                color={
                  !ltv
                    ? ""
                    : ltv > ltvMax
                    ? palette.error.main
                    : ltv > recommendedLTV(ltvMax)
                    ? palette.warning.main
                    : palette.success.main
                }
                mr=".5rem"
              >
                LTV {ltv <= 100 && ltv >= 0 ? `${ltv.toFixed(0)}%` : "n/a"}
              </Typography>
              <Typography variant="smallDark">
                (Recommended: {recommendedLTV(ltvMax)}%)
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

export default TokenCard

TokenCard.defaultProps = {
  disabled: false,
}
