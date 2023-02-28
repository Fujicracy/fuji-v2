import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { useEffect, useState } from "react"

import { useAuth } from "../../store/auth.store"
import { usePositions } from "../../store/positions.store"
import { useRouter } from "next/router"
import { formatValue } from "../../helpers/values"

type MetricSummary = {
  name: string
  value: number | "-"
  valueSym?: "$" | "%"
  action?: string
  tooltip?: boolean
}

const initialKeyMetrics: MetricSummary[] = [
  { name: "Total Deposits", value: "-", valueSym: "$" },
  { name: "Total Debt", value: "-", valueSym: "$" },
  { name: "Net APY", value: "-", valueSym: "%" /*action: "View"*/ }, // TODO: tooltip & actions
  {
    name: "Available to Borrow",
    value: "-",
    valueSym: "$",
    action: "Borrow more",
  }, // TODO: tooltip & actions
  // { name: "Positions at Risk", value: 3, action: "Close position" }, // TODO: tooltip & actions
]

function updateKeyMetricsSummary(
  totalDeposits_: number | undefined,
  totalDebt_: number | undefined,
  totalAPY_: number | undefined,
  availableBorrow_: number | undefined
): MetricSummary[] {
  return [
    {
      name: "Total Deposits",
      value: totalDeposits_ === undefined ? "-" : totalDeposits_,
      valueSym: "$",
    },
    {
      name: "Total Debt",
      value: totalDebt_ === undefined ? "-" : totalDebt_,
      valueSym: "$",
    },
    {
      name: "Net APY",
      value: totalAPY_ === undefined ? "-" : totalAPY_,
      valueSym: "%",
      // action: "View",
      tooltip: true,
    }, // TODO: tooltip & actions
    {
      name: "Available to Borrow",
      value: availableBorrow_ === undefined ? "-" : availableBorrow_,
      valueSym: "$",
      action: "Borrow more",
    },
  ]
}

function MyPositionsSummary() {
  const { breakpoints, palette } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))
  const router = useRouter()

  const account = useAuth((state) => state.address)
  const totalDeposits = usePositions((state) => state.totalDepositsUSD)
  const totalDebt = usePositions((state) => state.totalDebtUSD)
  const totalAPY = usePositions((state) => state.totalAPY)
  const availableBorrow = usePositions((state) => state.availableBorrowPowerUSD)

  const [keyMetrics, setKeyMetrics] = useState(initialKeyMetrics)

  useEffect(() => {
    if (account === undefined) {
      setKeyMetrics(initialKeyMetrics)
    } else {
      const updatedKeyMetrics = updateKeyMetricsSummary(
        totalDeposits,
        totalDebt,
        totalAPY,
        availableBorrow
      )
      setKeyMetrics(updatedKeyMetrics)
    }
  }, [account, totalDeposits, totalDebt, totalAPY, availableBorrow])

  return (
    <Box mt={4}>
      <Card
        variant="outlined"
        sx={{ background: palette.secondary.contrastText }}
      >
        <Grid container>
          {keyMetrics.map((m, i) => (
            <Grid item padding={{ xs: 1, md: 0 }} key={m.name} xs={6} md>
              <Metric
                metric={m}
                borderLeft={!isMobile && i > 0}
                onClick={() => {
                  if (m.action === "Borrow more") {
                    router.push("/borrow")
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  )
}

export default MyPositionsSummary

type MetricProps = {
  metric: MetricSummary
  borderLeft: boolean
  onClick: () => void
}

const Metric = ({ metric, borderLeft: leftBorder, onClick }: MetricProps) => {
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
  }

  return (
    <Box
      borderLeft={leftBorder ? `1px solid ${borderColor}` : ""}
      pl={leftBorder ? 4 : ""}
    >
      <Typography color={nameColor} fontSize="0.875rem">
        {metric.name}{" "}
        {metric.tooltip && (
          // TODO: tooltip
          <Tooltip
            arrow
            title={
              <span>
                Net APY accounts for all positions, APR earned by collateral
                minus APR accrued by debt
              </span>
            }
            placement="top"
          >
            <InfoOutlinedIcon
              sx={{ fontSize: "1rem", color: palette.info.main }}
            />
          </Tooltip>
        )}
      </Typography>

      {/* TODO: use helper to format balance */}
      <Typography
        fontSize="1.5rem"
        color={metric.name === "Positions at Risk" ? "error" : "inherit"}
      >
        {metric.valueSym === "$"
          ? `${formatValue(metric.value, {
              style: "currency",
              maximumFractionDigits: 0,
            })}`
          : metric.valueSym === "%"
          ? `${metric.value}%`
          : metric.value}{" "}
        {isMobile && <br />}
        {metric.action && metric.value > 0 && (
          // TODO: Button need refactoring in theme, variant need to change colors / background / borders, size need to change padding / fontsize
          <Button
            variant="secondary2"
            sx={buttonSx}
            disabled={metric.value === "-"}
            onClick={onClick}
          >
            {metric.action}
          </Button>
        )}
      </Typography>
    </Box>
  )
}
