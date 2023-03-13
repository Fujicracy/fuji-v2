import { Link, Tooltip } from "@mui/material"
import React from "react"

type ClickableTooltipProps = {
  title: string
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
}

function ClickableTooltip(props: ClickableTooltipProps) {
  const [open, setOpen] = React.useState(false)

  const handleTooltipClose = () => setOpen(false)

  const handleTooltipOpen = () => setOpen(true)

  return (
    <Tooltip
      title={props.title}
      placement={props.placement}
      onClose={handleTooltipClose}
      open={open}
      arrow
      sx={{ display: { xs: "inline", sm: "none" } }}
    >
      <Link onClick={handleTooltipOpen}>{props.children}</Link>
    </Tooltip>
  )
}

export default ClickableTooltip
