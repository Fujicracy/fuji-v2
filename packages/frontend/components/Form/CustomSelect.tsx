import React from "react"
import {
  FormControl,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import { chains } from "../../store"
import styles from "../../styles/components/Borrow.module.css"

type Chain = typeof chains[0]

interface CustomSelectProps {
  labelId: string
  id: string
  onSelect: (e: SelectChangeEvent<any>) => void
  value: string | number
  options: Chain[] | string[]
  label: string | null
  large: boolean | null
}

export default function CustomSelect(props: CustomSelectProps) {
  return (
    <FormControl>
      <Grid container alignItems="center">
        <label id={props.labelId} className={styles.selectLabel}>
          {props.label}
        </label>
        <Select
          labelId={props.labelId}
          id={props.id}
          value={props.value}
          onChange={props.onSelect}
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
          {/* TODO: I don't understand why I have error if I try to map without casting this to any. */}
          {(props.options as any[]).map((option: Chain | string) => (
            <MenuItem
              key={typeof option === "string" ? option : option.id}
              value={typeof option === "string" ? option : option.id}
            >
              <Grid container>
                <Image
                  src={`/assets/images/protocol-icons/${
                    typeof option === "string" ? "tokens" : "networks"
                  }/${typeof option === "string" ? option : option.label}.svg`}
                  height={props.large ? 24 : 18}
                  width={props.large ? 24 : 18}
                  alt={typeof option === "string" ? option : option.label}
                />
                <span
                  style={{
                    marginLeft: "0.5rem",
                  }}
                >
                  <Typography variant={props.large ? "h6" : "small"}>
                    {typeof option === "string" ? option : option.label}
                    {typeof option === "string" ? "" : " Network"}
                  </Typography>
                </span>
              </Grid>
            </MenuItem>
          ))}
        </Select>
      </Grid>
    </FormControl>
  )
}
