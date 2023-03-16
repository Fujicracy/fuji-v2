import { Tooltip } from "@mui/material"
import React from "react"

type WithTooltipProps = {
  title: React.ReactElement | string
  children: React.ReactElement
  placement:
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "right-start"
    | "right-end"
    | "left-start"
    | "left-end"
    | undefined
  defaultOpen?: boolean
}

function TooltipWrapper({
  title,
  children,
  placement,
  defaultOpen,
}: WithTooltipProps) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen))

  return (
    <Tooltip
      title={title}
      placement={placement}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      arrow
      sx={{ display: { xs: "inline", sm: "none" } }}
    >
      <div style={{ cursor: "pointer" }}>{children}</div>
    </Tooltip>
  )
}

export default TooltipWrapper
