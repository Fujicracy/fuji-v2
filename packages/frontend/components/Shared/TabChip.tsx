import React from "react"
import { useTheme } from "@mui/material/styles"
import { Chip } from "@mui/material"

type TabChipProps = {
  selected: boolean
  label: string
  sx: any | undefined
  onClick: () => void
}

function TabChip({ selected, label, sx, onClick }: TabChipProps) {
  const { palette, typography } = useTheme()
  const variant = selected ? "outlined" : "filled"
  const style = selected
    ? { borderColor: palette.error.main }
    : {
        background: palette.secondary.main,
        color: palette.text.disabled,
      }

  return (
    <Chip
      variant={variant}
      label={label}
      sx={{
        ...style,
        height: 44,
        fontSize: typography.body1,
        paddingLeft: 1,
        paddingRight: 1,
        ...sx,
      }}
      onClick={() => {
        onClick()
      }}
    />
  )
}

export default TabChip

TabChip.defaultProps = {
  sx: undefined,
}
