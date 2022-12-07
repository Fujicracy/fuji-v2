import { ReactElement } from "react"
import { Box, Chip, Paper, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { Stack } from "@mui/system"
import CircleIcon from "@mui/icons-material/Circle"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"

import { chainName } from "../../helpers/chainName"
import { useStore } from "../../store"
import NetworkIcon from "../NetworkIcon"
import TokenIcon from "../TokenIcon"

type Step = {
  icon: ReactElement
  label: string
}

type Route = {
  cost: number
  time: number
  steps: Step[]
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
  const collateral = useStore((state) => state.position.collateral)
  const debt = useStore((state) => state.position.debt)

  return (
    <Paper
      sx={{
        border: `2px solid ${
          props.selected ? palette.primary.main : palette.secondary.light
        }`,
        mt: "1rem",
        p: "1.5rem",
        cursor: "pointer",
        background: palette.secondary.dark,
      }}
      onClick={props.onChange}
    >
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
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
            <Chip variant="routing" label="Click To Select" />
          )}
        </Stack>
      </Stack>
      <Stack mt="1rem" direction="row" justifyContent="space-between">
        <Stack direction="row" alignItems="center">
          <TokenIcon token={collateral.token} height={32} width={32} />
          <NetworkIcon
            networkName={chainName(collateral.token.chainId)}
            height={16}
            width={16}
            sx={{
              position: "relative",
              right: "0.75rem",
              top: "0.8rem",
            }}
          />

          <Box>
            <Typography variant="body">
              {collateral.amount} {collateral.token.symbol}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(collateral.token.chainId)}
            </Typography>
          </Box>
        </Stack>

        {props.route.steps.length === 1 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{
              width: "24.5rem",
              position: "relative",
              top: "1.25rem",
              borderTop: `1px dashed ${palette.info.main}`,
            }}
          >
            <CircleIcon
              sx={{
                fontSize: "0.5rem",
                position: "absolute",
                right: "24.5rem",
                bottom: "2.55rem",
              }}
            />
            <KeyboardArrowRightIcon
              sx={{
                fontSize: "1.2rem",
                position: "absolute",
                left: "24rem",
                bottom: "2.22rem",
              }}
            />
            <Box
              sx={{
                position: "relative",
                bottom: "0.5rem",
              }}
            >
              <Stack direction="column">
                <NetworkIcon
                  networkName={chainName(debt.token.chainId)}
                  height={18}
                  width={18}
                />
                <Typography m="6px" variant="xsmall">
                  {props.route.steps[0].label}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        )}

        <Stack direction="row">
          <Box sx={{ textAlign: "right", mr: "0.5rem" }}>
            <Typography variant="body">
              {debt.amount} {debt.token.symbol}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(debt.token.chainId)}
            </Typography>
          </Box>
          <TokenIcon token={debt.token} height={32} width={32} />
          <NetworkIcon
            networkName={chainName(debt.token.chainId)}
            height={16}
            width={16}
            sx={{
              position: "relative",
              right: "0.75rem",
              top: "1.5rem",
            }}
          />
        </Stack>
      </Stack>

      {props.route.steps.length > 1 && (
        <Box
          m="0.5rem 2rem 1.5rem 1rem"
          sx={{
            position: "relative",
            height: "2.5rem",
            border: `1px dashed ${palette.info.main}`,
            borderTop: 0,
          }}
        >
          <CircleIcon
            sx={{
              fontSize: "0.5rem",
              position: "absolute",
              left: "-.28rem",
              bottom: "2rem",
            }}
          />
          <KeyboardArrowUpIcon
            sx={{
              fontSize: "1.2rem",
              position: "absolute",
              right: "-.64rem",
              bottom: "1.7rem",
            }}
          />
          <Box
            sx={{
              position: "relative",
              top: "2rem",
            }}
          >
            <Stack direction="row" justifyContent="space-around">
              {props.route.steps.map((step, i) => (
                <Stack key={i} direction="column">
                  {step.icon}
                  <Typography m="6px" variant="xsmall">
                    {step.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      )}
    </Paper>
  )
}
