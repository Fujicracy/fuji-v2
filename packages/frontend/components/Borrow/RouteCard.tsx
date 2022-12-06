import {
  Box,
  Chip,
  Paper,
  Step,
  StepConnector,
  stepConnectorClasses,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material"
import { styled, useTheme } from "@mui/material/styles"
import { StepIconProps } from "@mui/material/StepIcon"
import { Stack } from "@mui/system"

import { chainName } from "../../helpers/chainName"
import { useStore } from "../../store"
import NetworkIcon from "../NetworkIcon"
import TokenIcon from "../TokenIcon"

type Route = {
  cost: number
  time: number
  steps: string[]
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
        background: palette.secondary.dark,
      }}
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
            <Chip
              onClick={props.onChange}
              variant="routing"
              label="Click To Select"
            />
          )}
        </Stack>
      </Stack>
      <Stack mt="1rem" direction="row" justifyContent="space-between">
        <Stack direction="row" alignItems="center">
          <TokenIcon token={collateral.token} height={32} width={32} />
          <Box
            sx={{
              position: "relative",
              right: "0.75rem",
              top: "0.8rem",
            }}
          >
            <NetworkIcon
              networkName={chainName(collateral.token.chainId)}
              height={16}
              width={16}
            />
          </Box>
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
          <Box
            sx={{
              position: "relative",
              right: "0.75rem",
              top: "1.5rem",
            }}
          >
            <NetworkIcon
              networkName={chainName(debt.token.chainId)}
              height={16}
              width={16}
            />
          </Box>
        </Stack>
      </Stack>

      <Box
        sx={{
          border: `1px dashed ${palette.info.main}`,
          borderTop: 0,
          height: "40px",
          ml: "1rem",
          mr: "2rem",
        }}
      ></Box>

      {/*  <Stepper
        sx={{ mt: "1.5rem" }}
        alternativeLabel
        connector={<CustomConnector />}
      >
        {props.route.steps.map((step) => (
          <Step key={step}>
            <StepLabel StepIconComponent={CustomStepIcon}>
              <Typography variant="xsmall">{step}</Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper> */}
    </Paper>
  )
}

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`& .${stepConnectorClasses.line}`]: {
    border: `0.5px dashed ${theme.palette.info.main}`,
  },
}))

function CustomStepIcon(props: StepIconProps) {
  const collateral = useStore((state) => state.position.collateral)
  const debt = useStore((state) => state.position.debt)

  const icons: Record<string, React.ReactElement> = {
    1: (
      <NetworkIcon
        networkName={chainName(collateral.token.chainId)}
        height={18}
        width={18}
      />
    ),
    2: <TokenIcon token={debt.token} height={18} width={18} />,
    3: (
      <NetworkIcon
        networkName={chainName(debt.token.chainId)}
        height={18}
        width={18}
      />
    ),
  }

  return <>{icons[String(props.icon)]}</>
}
