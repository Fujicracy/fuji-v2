import { Typography, Grid, Select, MenuItem, Stack } from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"
import { chains } from "../../store/auth.slice"
import styles from "../../styles/components/Borrow.module.css"

type ChainSelectProps = {
  label: string
  value: string
  onChange: (chainId: string) => void
}
export const ChainSelect = (props: ChainSelectProps) => {
  const { value, label, onChange } = props

  return (
    <Stack alignItems="center" direction="row" mb="1rem">
      <label id={`${label}-label`} className={styles.selectLabel}>
        {label}
      </label>
      <Select
        labelId="collateral-chain-label"
        id="collateral-chain"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        IconComponent={KeyboardArrowDownIcon}
        variant="standard"
        disableUnderline
      >
        {chains.map((chain) => (
          <MenuItem key={chain.id} value={chain.id}>
            <Grid container>
              <Image
                src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                height={18}
                width={18}
                alt={chain.label}
              />
              <span style={{ marginLeft: "0.5rem" }}>
                <Typography variant="small">{chain.label}</Typography>
              </span>
            </Grid>
          </MenuItem>
        ))}
      </Select>
    </Stack>
  )
}
