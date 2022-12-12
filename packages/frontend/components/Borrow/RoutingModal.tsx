import { useState } from "react"
import { Dialog, DialogContent, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import CloseIcon from "@mui/icons-material/Close"

import RouteCard from "./RouteCard"
import { useStore } from "../../store"
import { chainName } from "../../helpers/chainName"
import NetworkIcon from "../NetworkIcon"
import TokenIcon from "../TokenIcon"

type RoutingModalProps = {
  open: boolean
  handleClose: () => void
}

export default function RoutingModal(props: RoutingModalProps) {
  const { palette } = useTheme()
  const [selectedRoute, setSelectedRoute] = useState(0)
  const collateral = useStore((state) => state.position.collateral)
  const debt = useStore((state) => state.position.debt)
  const providers = useStore((state) => state.position.providers)

  const collateralChain = chainName(collateral.token.chainId)
  const debtChain = chainName(debt.token.chainId)
  const providerName = providers?.length ? providers[0].name : "n/a"

  const routes = [
    {
      cost: 3.9,
      time: 2,
      steps: [
        {
          icon: (
            <NetworkIcon network={collateralChain} height={18} width={18} />
          ),
          label: `Deposit ${collateral.amount} ${collateral.token.symbol} to ${providerName}`,
        },
        {
          icon: <TokenIcon token={debt.token} height={18} width={18} />,
          label: `Borrow ${debt.amount} ${debt.token.symbol} from ${providerName}`,
        },
        {
          icon: <NetworkIcon network={debtChain} height={18} width={18} />,
          label: `Bridge to ${collateralChain} via Connext`,
        },
      ],
      recommended: true,
      info: `Deposited in ${providerName}`,
    },
    {
      cost: 4.6,
      time: 2,
      steps: [
        {
          icon: (
            <NetworkIcon network={collateralChain} height={18} width={18} />
          ),
          label: `Deposit ${collateral.amount} ${collateral.token.symbol} to ${providerName}`,
        },
        {
          icon: <TokenIcon token={debt.token} height={18} width={18} />,
          label: `Borrow ${debt.amount} ${debt.token.symbol} from ${providerName}`,
        },
        {
          icon: <NetworkIcon network={debtChain} height={18} width={18} />,
          label: `Bridge to ${collateralChain} via Connext`,
        },
      ],
      recommended: false,
      info: `Deposited in ${providerName}`,
    },
  ]

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
