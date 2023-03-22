import { RoutingStep, RoutingStepDetails, Token } from "@x-fuji/sdk"

import { formatUnits } from "ethers/lib/utils"
import { Box, Chip, Collapse, Paper, Typography, Tooltip } from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { useTheme } from "@mui/material/styles"
import { Stack } from "@mui/system"
import { BigNumber } from "ethers"

import { chainName } from "../../../helpers/chains"
import {
  NetworkIcon,
  TokenIcon,
  TokenWithNetworkIcon,
} from "../../Shared/Icons"
import { RouteMeta } from "../../../helpers/routing"
import { toNotSoFixed, camelize } from "../../../helpers/values"

type RouteCardProps = {
  route: RouteMeta
  selected: boolean
  onChange: () => void
}

function RouteCard({ route, selected, onChange }: RouteCardProps) {
  const { palette } = useTheme()
  console.log(route.steps)
  const bridgeStep = route.steps.find((s) => s.step === RoutingStep.X_TRANSFER)
  const startStep = route.steps.find((s) => s.step === RoutingStep.START)
  const endStep = route.steps.find((s) => s.step === RoutingStep.END)

  const steps = route.steps.filter(
    (s) => s.step !== RoutingStep.START && s.step !== RoutingStep.END
  )

  function iconForStep(step: RoutingStepDetails) {
    if (step.step === RoutingStep.X_TRANSFER) {
      return (
        <NetworkIcon network={chainName(step.chainId)} height={18} width={18} />
      )
    } else if (step.token) {
      return <TokenIcon token={step.token} height={18} width={18} />
    }
    return <></>
  }

  function textForStep({ step, amount, token, chainId }: RoutingStepDetails) {
    switch (step) {
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return camelize(
          `${step.toString()} ${toNotSoFixed(
            formatUnits(amount ?? 0, token?.decimals || 18)
          )} ${token?.symbol}`
        )
      case RoutingStep.X_TRANSFER:
        return camelize(
          `${step.toString()} to ${chainName(chainId)} via Connext`
        )
      default:
        return camelize(step)
    }
  }

  function slippageText() {
    if (!bridgeStep) return ""
    const bridgeIndex = steps.indexOf(bridgeStep)
    const step =
      bridgeIndex === 0 ? steps[bridgeIndex + 1] : steps[bridgeIndex - 1]

    return ` On ${camelize(step.step)}`
  }

  function slippageTextTooltip() {
    if (!bridgeStep) return ""
    const bridgeIndex = steps.indexOf(bridgeStep)
    const step =
      bridgeIndex === 0 ? steps[bridgeIndex + 1] : steps[bridgeIndex - 1]
    const slippage = route.estimateSlippage
    const direction = slippage >= 0 ? "less" : "more"
    const sign = slippage < 0 ? "positive" : "negative"

    return `You are expected to ${step.step} ~${Math.abs(slippage).toFixed(
      2
    )}% ${direction}
      than the requested amount due to a ${sign} slippage.`
  }

  function roundStepAmount(step: RoutingStepDetails | undefined) {
    if (!step) return 0
    const formatted = formatUnits(
      step.amount ?? BigNumber.from("0"),
      step.token?.decimals ?? 18
    )
    return Number(formatted).toFixed(3)
  }

  return (
    <Paper
      sx={{
        border: `2px solid ${
          selected ? palette.primary.main : palette.secondary.light
        }`,
        p: `${route.recommended ? "0" : "1.5rem"} 1.5rem 0 1.5rem`,
        marginTop: "1rem",
        cursor: "pointer",
        background: palette.secondary.dark,
      }}
      onClick={onChange}
    >
      {route.recommended && <Chip variant="recommended" label="Recommended" />}

      <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
        <Stack direction="row" gap="0.5rem">
          {bridgeStep && (
            <>
              <Chip
                variant="routing"
                label={`Est Processing Time ~${route.estimateTime / 60} Mins`}
              />
              <Tooltip
                arrow
                title={<span>0.05% from the bridged amount</span>}
                placement="top"
              >
                <Chip
                  icon={
                    <InfoOutlinedIcon
                      sx={{ fontSize: "1rem", color: palette.info.main }}
                    />
                  }
                  variant="routing"
                  label={`Bridge Fee ~$${route.bridgeFee.toFixed(2)}`}
                />
              </Tooltip>
            </>
          )}
          {bridgeStep && route.estimateSlippage !== undefined && (
            <>
              <Tooltip
                arrow
                title={<span>{slippageTextTooltip()}</span>}
                placement="top"
              >
                <Chip
                  icon={
                    <InfoOutlinedIcon
                      sx={{ fontSize: "1rem", color: palette.info.main }}
                    />
                  }
                  variant="routing"
                  label={
                    <>
                      Price Impact{slippageText()}:{" "}
                      <span
                        style={{
                          color:
                            route.estimateSlippage < 0
                              ? palette.success.main
                              : palette.error.main,
                        }}
                      >
                        {`${(-route.estimateSlippage).toFixed(2)}%`}
                      </span>
                    </>
                  }
                />
              </Tooltip>
            </>
          )}
        </Stack>

        <Chip
          variant={selected ? "selected" : "routing"}
          label={selected ? "Selected" : "Click To Select"}
        />
      </Stack>

      <Stack mt="1rem" direction="row" justifyContent="space-between">
        <Stack direction="row">
          <TokenWithNetworkIcon
            token={startStep?.token as Token}
            network={chainName(startStep?.chainId)}
          />
          <Box>
            <Typography variant="body">
              {roundStepAmount(startStep)} {startStep?.token?.symbol}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(startStep?.chainId)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row">
          <Box textAlign="right" mr="0.75rem">
            <Typography variant="body">
              {roundStepAmount(endStep)} {endStep?.token?.symbol}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(endStep?.chainId)}
            </Typography>
          </Box>

          <TokenWithNetworkIcon
            token={endStep?.token as Token}
            network={chainName(endStep?.chainId)}
          />
        </Stack>
      </Stack>

      {!selected && (
        <Collapse sx={{ maxHeight: "2.5rem" }} in={!selected}>
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
              {bridgeStep ? (
                <Stack direction="column" alignItems="center">
                  <>
                    {iconForStep(bridgeStep)}
                    <Typography
                      m="0.375rem"
                      variant="xsmall"
                      align="center"
                      sx={{ maxWidth: "9rem" }}
                    >
                      {textForStep(bridgeStep)}
                    </Typography>
                  </>
                </Stack>
              ) : (
                <Stack direction="row" justifyContent="space-around">
                  {steps.map((step, i) => (
                    <Stack key={i} direction="column">
                      {iconForStep(step)}
                      <Typography
                        m="0.375rem"
                        align="center"
                        variant="xsmall"
                        sx={{ maxWidth: "6.5rem" }}
                      >
                        {textForStep(step)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Collapse>
      )}

      <Collapse in={selected}>
        <Box
          m="0.5rem 1.7rem 1.5rem 0.8rem"
          sx={{
            backgroundImage: "url('/assets/images/utils/multiple-routes.svg')",
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
              {steps.map((step, i) => (
                <Stack key={i} direction="column">
                  {iconForStep(step)}
                  <Typography
                    m="0.375rem"
                    align="center"
                    variant="xsmall"
                    sx={{ maxWidth: "6.5rem" }}
                  >
                    {textForStep(step)}
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

export default RouteCard
