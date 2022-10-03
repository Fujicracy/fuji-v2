import React from "react"
import { useTheme } from "@mui/material/styles"
import {
  Card,
  FormControl,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"

import CustomSelect from "./Form/CustomSelect"
import styles from "../styles/components/Borrow.module.css"
import Image from "next/image"

declare interface SelectTokenCardProps {
  value: string
  onChangeValue: (e: React.ChangeEvent<HTMLInputElement>) => void
  token: string
  onChangeToken: (e: SelectChangeEvent<string>) => void
  tokens: string[]
  type: "collateral" | "borrow"
}

export default function SelectTokenCard(props: SelectTokenCardProps) {
  const theme = useTheme()

  return (
    <Card variant="outlined">
      <div className={styles.cardLine}>
        <TextField
          id="collateral-amount"
          type="number"
          placeholder="0"
          value={props.value}
          onChange={props.onChangeValue}
          sx={{
            fontSize: "1.125rem",
            boxShadow: "none",
            ".MuiOutlinedInput-notchedOutline": {
              border: 0,
            },
            width: "40%",
          }}
        />

        <FormControl>
          <Grid container alignItems="center">
            <Select
              labelId="collateral-token-label"
              id="collateral-token"
              value={props.token}
              onChange={props.onChangeToken}
              IconComponent={KeyboardArrowDownIcon}
              sx={{
                marginBottom: "1rem",
                boxShadow: "none",
                ".MuiOutlinedInput-notchedOutline": {
                  border: 0,
                },
              }}
              variant="standard"
              disableUnderline
            >
              {props.tokens.map((token: string) => (
                <MenuItem key={token} value={token}>
                  <Grid container>
                    <Image
                      src={`/assets/images/protocol-icons/tokens/${token}.svg`}
                      height={24}
                      width={24}
                      alt={token}
                    />
                    <span
                      style={{
                        marginLeft: "0.5rem",
                      }}
                    >
                      <Typography variant="h6">{token}</Typography>
                    </span>
                  </Grid>
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </FormControl>
      </div>
      <div className={styles.cardLine}>
        {props.type === "collateral" ? (
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
              >
                MAX
              </Typography>

              <Typography variant="small">
                <Typography variant="smallDark">Balance</Typography>: 2.88 ETH
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
