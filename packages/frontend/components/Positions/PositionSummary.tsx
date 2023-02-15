import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { useEffect, useState } from "react"

import { usePositions } from "../../store/positions.store"

type Metric = {
  name: string
  value: number | "-"
  valueSym?: "$" | "%"
  action?: string
}

const initialKeyMetrics: Metric[] = [
  { name: "Total Deposits", value: "-", valueSym: "$" },
  { name: "Total Debt", value: "-", valueSym: "$" },
  { name: "Net APY", value: "-", valueSym: "%", action: "View" }, // TODO: tooltip & actions
  {
    name: "Available to Borrow",
    value: "-",
    valueSym: "$",
    action: "Borrow",
  }, // TODO: tooltip & actions
  // { name: "Positions at Risk", value: 3, action: "Close position" }, // TODO: tooltip & actions
]

export function PositionSummary() {
  const { breakpoints, palette } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const fetchPositions = usePositions((state) => state.fetchUserPositions)

  const totalDeposits = usePositions((state) => state.totalDepositsUSD)
  const totalDebt = usePositions((state) => state.totalDebtUSD)
  const totalAPY = usePositions((state) => state.totalAPY)
  const availableBorrow = usePositions((state) => state.availableBorrowPowerUSD)

  const [keyMetrics, setKeyMetrics] = useState(initialKeyMetrics)

  useEffect(() => {
    if (totalDeposits) {
      // TODO: Once we have data, update keyMetrics
      window.alert(totalDeposits)
    }
  }, [totalDeposits])

  // TODO: refactor changed on the keyMetrics/state change
  // We want to display only 4 metrics in mobile, so we leave positions at risk aside.
  const metrics = keyMetrics.filter((m) =>
    isMobile ? m.name !== "Positions at Risk" : true
  )

  return (
    <Box mt={4}>
      <Card
        variant="outlined"
        sx={{ background: palette.secondary.contrastText }}
      >
        <Grid container>
          {metrics.map((m, i) => (
            <Grid item padding={{ xs: 1, md: 0 }} key={m.name} xs={6} md>
              <Metric metric={m} borderLeft={!isMobile && i > 0} />
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  )
}

type MetricProps = { metric: Metric; borderLeft: boolean }

const Metric = ({ metric, borderLeft: leftBorder }: MetricProps) => {
  const { palette, breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const borderColor = palette.secondary.light // TODO: should use a palette border color instead
  const nameColor = palette.info.main
  const buttonSx = {
    padding: "6px 16px 5px",
    lineHeight: "0.875rem",
    fontSize: "0.875rem",
    backgroundColor: palette.secondary.main,
    border: "none",
    color: palette.text.primary,
  }

  return (
    <Box
      borderLeft={leftBorder ? `1px solid ${borderColor}` : ""}
      pl={leftBorder ? 4 : ""}
    >
      <Typography color={nameColor} fontSize="0.875rem">
        {metric.name}
      </Typography>
      {/* TODO: use helper to format balance */}
      <Typography
        fontSize="1.5rem"
        color={metric.name === "Positions at Risk" ? "error" : "inherit"}
      >
        {metric.valueSym === "$"
          ? `${metric.value.toLocaleString("en-US", {
              style: "currency",
              currency: "usd",
              maximumFractionDigits: 0,
            })}`
          : metric.valueSym === "%"
          ? `${metric.value}%`
          : metric.value}{" "}
        {isMobile && <br />}
        {metric.action && (
          // TODO: Button need refactoring in theme, variant need to change colors / background / borders, size need to change padding / fontsize
          <Button
            variant="secondary"
            sx={buttonSx}
            disabled={metric.value === "-"}
          >
            {metric.action}
          </Button>
        )}
      </Typography>
    </Box>
  )
}
