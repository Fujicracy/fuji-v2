import { useState } from "react"
import { Dialog, DialogContent, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"
import RouteCard from "./RouteCard"

type RoutingModalProps = {
  open: boolean
  handleClose: () => void
}

export default function RoutingModal(props: RoutingModalProps) {
  const { palette } = useTheme()
  const [selectedRoute, setSelectedRoute] = useState(0)

  const routes = [
    {
      cost: 3.9,
      time: 2,
      steps: [],
    },
    {
      cost: 4.6,
      time: 2,
      steps: [],
    },
    {
      cost: 11.2,
      time: 4,
      steps: [],
    },
  ]

  return (
    <Dialog onClose={() => props.handleClose()} open={props.open}>
      <DialogContent
        sx={{
          p: "1.5rem",
          background: palette.secondary.contrastText,
          borderRadius: "1.125rem",
          border: `0.063rem solid ${palette.secondary.light}`,
        }}
      >
        <CloseIcon
          sx={{
            cursor: "pointer",
            position: "absolute",
            right: "2rem",
          }}
          onClick={props.handleClose}
        />
        <Typography variant="body2">Best Route</Typography>

        {routes.map((route, i) => (
          <RouteCard
            key={i}
            onChange={() => setSelectedRoute(i)}
            route={route}
            selected={i === selectedRoute}
          />
        ))}
      </DialogContent>
    </Dialog>
  )
}
