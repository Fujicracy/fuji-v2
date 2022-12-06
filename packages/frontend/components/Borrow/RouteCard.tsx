import { Chip, Paper } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { Stack } from "@mui/system"

type Route = {
  cost: number
  time: number
  steps: object[]
  recommended: boolean
  info: string
}

type RouteCardProps = {
  route: Route
  selected: boolean
  onChange: () => void
}

export default function RouteCard(props: RouteCardProps) {
  const { palette } = useTheme()

  return (
    <Paper
      sx={{
        border: `2px solid ${
          props.selected ? palette.primary.main : palette.secondary.light
        }`,
        mt: "1rem",
        p: "1.5rem",
        background: palette.secondary.dark,
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" gap="0.5rem">
          <Chip
            variant="routing"
            label={`Est Cost ~$${props.route.cost.toFixed(2)}`}
          />
          <Chip
            variant="routing"
            label={`Est Processing Time ~${props.route.time} Mins`}
          />
          {props.route.info && (
            <Chip variant="routing" label={props.route.info} />
          )}
        </Stack>

        <Stack direction="row" gap="0.5rem">
          {props.route.recommended && (
            <Chip
              variant="routing"
              label="Recommended"
              sx={{ color: palette.primary.main }}
            />
          )}

          {props.selected ? (
            <Chip
              variant="routing"
              label="Selected"
              sx={{
                color: palette.primary.main,
                border: `1px solid ${palette.primary.main}`,
              }}
            />
          ) : (
            <Chip
              onClick={props.onChange}
              variant="routing"
              label="Click To Select"
            />
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
