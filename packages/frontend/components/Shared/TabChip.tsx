import React from "react"
import { useTheme } from "@mui/material/styles"
import { Chip } from "@mui/material"

type TabChipProps = {
  selected: boolean
  label: string
  sx: any | undefined
  onClick: () => void
}

function TabChip(props: TabChipProps) {
  const { palette, typography } = useTheme()
  const variant = props.selected ? "outlined" : "filled"
  const style = props.selected
    ? { borderColor: palette.error.main }
    : {
        background: palette.secondary.main,
        color: palette.text.disabled,
      }

  return (
    <Chip
      variant={variant}
      label={props.label}
      sx={{
        ...style,
        height: 44,
        fontSize: typography.body1,
        paddingLeft: 1,
        paddingRight: 1,
        ...props.sx,
      }}
      onClick={() => {
        props.onClick()
      }}
    />
  )
}

export default TabChip

TabChip.defaultProps = {
  sx: undefined,
}
