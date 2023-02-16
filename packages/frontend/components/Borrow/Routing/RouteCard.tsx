import { Box, Chip, Collapse, Paper, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { Stack } from "@mui/system"

import { useBorrow } from "../../../store/borrow.store"
import { chainName } from "../../../services/chains"
import { NetworkIcon, TokenIcon } from "../../Shared/Icons"

type Step = {
  icon: React.ReactElement
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
  const collateral = useBorrow((state) => state.position.collateral)
  const collateralInput = useBorrow((state) => state.collateralInput)
  const debt = useBorrow((state) => state.position.debt)
  const debtInput = useBorrow((state) => state.debtInput)

  const bridgeStep = props.route.steps.filter((step) =>
    step.label.toLowerCase().includes("bridge")
  )

  return (
    <Paper
      sx={{
        border: `2px solid ${
          props.selected ? palette.primary.main : palette.secondary.light
        }`,
        p: `${props.route.recommended ? "0" : "1.5rem"} 1.5rem 0 1.5rem`,
        marginTop: "1rem",
        cursor: "pointer",
        background: palette.secondary.dark,
      }}
      onClick={props.onChange}
    >
      {props.route.recommended && (
        <Chip variant="recommended" label="Recommended" />
      )}

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

        <Chip
          variant={props.selected ? "selected" : "routing"}
          label={props.selected ? "Selected" : "Click To Select"}
        />
      </Stack>

      <Stack mt="1rem" direction="row" justifyContent="space-between">
        <Stack direction="row">
          <TokenIcon token={collateral.token} height={32} width={32} />
          <NetworkIcon
            network={chainName(collateral.token.chainId)}
            height={16}
            width={16}
            sx={{
              position: "relative",
              right: "0.75rem",
              top: "1.5rem",
              border: "0.5px solid white",
              borderRadius: "100%",
              height: "17px",
              width: "17px",
            }}
          />

          <Box>
            <Typography variant="body">
              {collateralInput} {collateral.token.symbol}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(collateral.token.chainId)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row">
          <Box textAlign="right" mr="0.75rem">
            <Typography variant="body">
              {debtInput} {debt.token.symbol}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(debt.token.chainId)}
            </Typography>
          </Box>

          <TokenIcon token={debt.token} height={32} width={32} />
          <NetworkIcon
            network={chainName(debt.token.chainId)}
            height={16}
            width={16}
            sx={{
              position: "relative",
              right: "0.75rem",
              top: "1.5rem",
              border: "0.5px solid white",
              borderRadius: "100%",
              height: "17px",
              width: "17px",
            }}
          />
        </Stack>
      </Stack>

      {!props.selected && (
        <Collapse sx={{ maxHeight: "2.5rem" }} in={!props.selected}>
          <Box
            sx={{
              position: "relative",
              width: "50%",
              bottom: "1.8rem",
              left: "25%",
              backgroundImage: 'url("./assets/images/utils/single-route.svg")',
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          >
            <Box
              sx={{
                position: "relative",
                bottom: ".3rem",
              }}
            >
              {bridgeStep.length > 0 ? (
                <Stack direction="column" alignItems="center">
                  <>
                    {bridgeStep[0].icon}
                    <Typography
                      m="0.375rem"
                      variant="xsmall"
                      align="center"
                      sx={{ maxWidth: "9rem" }}
                    >
                      {bridgeStep[0].label}
                    </Typography>
                  </>
                </Stack>
              ) : (
                <Stack direction="row" justifyContent="space-around">
                  {props.route.steps.map((step, i) => (
                    <Stack key={i} direction="column">
                      {step.icon}
                      <Typography
                        m="0.375rem"
                        align="center"
                        variant="xsmall"
                        sx={{ maxWidth: "6.5rem" }}
                      >
                        {step.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Collapse>
      )}

      <Collapse in={props.selected}>
        <Box
          m="0.5rem 1.7rem 1.5rem 0.8rem"
          sx={{
            backgroundImage: "url('./assets/images/utils/multiple-routes.svg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
          }}
        >
          <Box
            sx={{
              position: "relative",
              top: "1.3rem",
            }}
          >
            <Stack direction="row" justifyContent="space-around">
              {props.route.steps.map((step, i) => (
                <Stack key={i} direction="column">
                  {step.icon}
                  <Typography
                    m="0.375rem"
                    align="center"
                    variant="xsmall"
                    sx={{ maxWidth: "6.5rem" }}
                  >
                    {step.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}
