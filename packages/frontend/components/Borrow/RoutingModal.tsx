import { useState } from "react"
import { Dialog, DialogContent, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"

import RouteCard from "./RouteCard"
import { useBorrow } from "../../store/borrow.store"

type RoutingModalProps = {
  open: boolean
  handleClose: () => void
}

export default function RoutingModal(props: RoutingModalProps) {
  const { palette } = useTheme()
  const [selectedRoute, setSelectedRoute] = useState(0)
  const availableRoutes = useBorrow((state) => state.availableRoutes)
  const updateVault = useBorrow((state) => state.updateVault)

  function didSelectRoute(i: number) {
    if (selectedRoute !== i) {
      updateVault(availableRoutes[i])
    }
    setSelectedRoute(i)
  }

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={() => props.handleClose()}
      open={props.open}
    >
      <DialogContent
        sx={{
          p: "1.5rem",
          background: palette.secondary.contrastText,
          borderRadius: "1.125rem",
          border: `1px solid ${palette.secondary.light}`,
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
        <Typography variant="body2">Available Routes</Typography>

        {availableRoutes.map((route, i) => (
          <RouteCard
            key={i}
            onChange={() => didSelectRoute(i)}
            route={route}
            selected={i === selectedRoute}
          />
        ))}
      </DialogContent>
    </Dialog>
  )
}
