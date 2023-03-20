import { Typography, Grid, Select, MenuItem, Stack, Fade } from "@mui/material"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { chains } from "../../../helpers/chains"
import { NetworkIcon } from "../../Shared/Icons"
import { AssetType } from "../../../helpers/assets"
import { ChainId } from "@x-fuji/sdk"

type ChainSelectProps = {
  label: string
  type: AssetType
  value: ChainId
  disabled?: boolean
  onChange: (chainId: ChainId) => void
}
const ChainSelect = ({
  value,
  label,
  type,
  disabled,
  onChange,
}: ChainSelectProps) => {
  const labelId = `${type}-label`
  const selectId = `${type}-chain-select`
  const menuId = `${type}-chain-menu`

  return (
    <Stack alignItems="center" direction="row" mb="1rem">
      <Typography id={labelId} variant="smallDark">
        {label}
      </Typography>
      <Select
        labelId={labelId}
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as ChainId)}
        IconComponent={KeyboardArrowDownIcon}
        variant="standard"
        disableUnderline
        MenuProps={{ TransitionComponent: Fade, id: menuId }}
      >
        {chains.map((chain) => {
          return (
            <MenuItem key={chain.chainId} value={chain.chainId}>
              <Grid container alignItems="center">
                <NetworkIcon network={chain.label} height={18} width={18} />
                <span style={{ marginLeft: "0.5rem" }}>
                  <Typography variant="small">{chain.label}</Typography>
                </span>
              </Grid>
            </MenuItem>
          )
        })}
      </Select>
    </Stack>
  )
}

export default ChainSelect
