import React from "react"
import {
  Card,
  FormControl,
  Grid,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import { Token } from "@x-fuji/sdk"
import styles from "../../styles/components/Borrow.module.css"

type SelectTokenCardProps = {
  value: number
  onChangeValue: (e: React.ChangeEvent<HTMLInputElement>) => void
  // TODO: handle the case where token is undefined
  token: string
  onChangeToken: (e: SelectChangeEvent<string>) => void
  tokens: Token[]
  type: "collateral" | "borrow"
  balance: number
  balances: number[]
  onMaxClicked: (e: React.MouseEvent<HTMLElement>) => void
}

export default function SelectTokenCard(props: SelectTokenCardProps) {
  const { palette } = useTheme()
  const {
    value,
    onChangeValue,
    token,
    onChangeToken,
    tokens,
    type,
    balance,
    balances,
    onMaxClicked,
  } = props

  if (!balances) {
    debugger
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
          value={value}
          onChange={onChangeValue}
          sx={{
            fontSize: "1.125rem",
            boxShadow: "none",
            ".MuiOutlinedInput-notchedOutline": { border: 0 },
            width: "40%",
          }}
        />

        <FormControl>
          <Grid container alignItems="center">
            <Select
              labelId="collateral-token-label"
              id="collateral-token"
              value={token}
              onChange={onChangeToken}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                boxShadow: "none",
                ".MuiOutlinedInput-notchedOutline": {
                  border: 0,
                },
              }}
              variant="standard"
              disableUnderline
            >
              {tokens.map((token, index) => (
                <MenuItem key={token.name} value={token.symbol}>
                  <Grid container alignItems="center">
                    <Grid item>
                      <Image
                        src={`/assets/images/protocol-icons/tokens/${token.symbol}.svg`}
                        height={24}
                        width={24}
                        alt={token.name}
                      />
                    </Grid>
                    <Grid item>
                      <Grid
                        container
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <ListItemText sx={{ ml: "0.5rem" }}>
                          <Typography variant="h6">{token.symbol}</Typography>
                        </ListItemText>
                        {balances?.length > 0 && type === "collateral" && (
                          <Typography variant="smallDark" ml="0.5rem">
                            {balances[index]}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </FormControl>
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
                onClick={onMaxClicked}
              >
                MAX
              </Typography>

              <Typography variant="small">
                <Typography variant="smallDark">Balance:</Typography>
                <Typography
                  sx={{
                    display: "inline",
                    color:
                      value > balance
                        ? palette.error.dark
                        : palette.text.primary,
                  }}
                >
                  {balance} {token}
                </Typography>
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
