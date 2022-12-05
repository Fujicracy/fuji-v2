import { Card, CardContent, Chip, Grid } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { Stack } from "@mui/system"

type Route = {
  cost: number
  time: number
  steps: object[]
}

type RouteCardProps = {
  route: Route
  selected: boolean
  onChange: (routeId: number) => void
}

export default function RouteCard(props: RouteCardProps) {
  const { palette } = useTheme()

  return (
    <Card
      sx={{
        border: `0.063rem solid ${palette.secondary.light}`,
        mt: "1.5rem",
      }}
    >
      <CardContent>
        <Stack direction="row" gap="0.5rem">
          <Chip label={`Est Cost ~$${props.route.cost.toFixed(2)}`} />
          <Chip label={`Est Processing Time ~${props.route.time} Mins`} />
          {props.selected && <Chip label="Collateral deposit Aave V2" />}
        </Stack>
      </CardContent>
    </Card>
  )
}
