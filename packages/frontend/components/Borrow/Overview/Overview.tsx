import React from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { formatUnits } from "ethers/lib/utils"

import LTVProgressBar from "./LTVProgressBar"

import ClickableTooltip from "../../Shared/ClickableTooltip"
import { useBorrow } from "../../../store/borrow.store"
import { NetworkIcon } from "../../Shared/Icons"
import VaultsMenu from "./VaultsMenu"
import { recommendedLTV } from "../../../helpers/borrow"
import { formatValue } from "../../../helpers/values"
import PositionCardGradItem from "./PositionCard"
import { BasePosition } from "../../../helpers/positions"

type OverviewProps = {
  basePosition: BasePosition
}

function Overview({ basePosition }: OverviewProps) {
  const { palette } = useTheme()
  const { position, futurePosition } = basePosition
  const {
    collateral,
    debt,
    ltv,
    ltvMax,
    ltvThreshold,
    liquidationDiff,
    liquidationPrice,
  } = position

  const allProviders = useBorrow((state) => state.allProviders)
  const vault = useBorrow((state) => state.activeVault)
  const providers =
    allProviders && vault ? allProviders[vault.address.value] : []

  const collateralInput = useBorrow((state) => state.collateral.input)
  const debtInput = useBorrow((state) => state.debt.input)

  const dynamicLtv = futurePosition ? futurePosition.ltv : ltv
  const dynamicLtvThreshold = futurePosition
    ? futurePosition.ltvThreshold
    : ltvThreshold

  return (
    <Grid container alignItems="center" justifyContent="space-between">
      <Card
        sx={{
          flexDirection: "column",
          alignItems: "center",
          p: "1.5rem 2rem",
          width: "100%",
        }}
      >
        <CardContent sx={{ padding: 0, gap: "1rem" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="40px"
          >
            <Typography variant="body2">Overview</Typography>
            {providers && vault && (
              <Stack direction="row" alignItems="center">
                <Tooltip
                  arrow
                  title={
                    <span>
                      We take into account variables such as liquidity, audits
                      and team behind each protocol, you can read more on our
                      risk framework{" "}
                      <Link
                        href="https://docs.fujidao.org/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <u> here</u>
                      </Link>
                    </span>
                  }
                  placement="top"
                >
                  <InfoOutlinedIcon
                    sx={{ fontSize: "1rem", color: palette.info.main }}
                  />
                </Tooltip>
                <Typography variant="smallDark" ml={0.5} mr={1}>
                  Safety rating:
                </Typography>
                <VaultsMenu vault={vault} providers={providers} />
              </Stack>
            )}
          </Stack>
          <Divider sx={{ mt: "1rem", mb: "1.5rem" }} />

          <Grid container columnSpacing="1rem">
            <PositionCardGradItem
              title="Collateral Provided"
              amount={`${formatValue(collateral.amount, {
                maximumFractionDigits: 3,
              })} ${collateral.token.symbol}`}
              footer={formatValue(collateral.amount * collateral.usdPrice, {
                style: "currency",
              })}
              extra={
                futurePosition && parseFloat(collateralInput) !== 0
                  ? formatValue(futurePosition.collateral.amount, {
                      maximumFractionDigits: 3,
                    })
                  : undefined
              }
            />
            <PositionCardGradItem
              title="Borrowed Value"
              amount={formatValue(debt.amount * debt.usdPrice, {
                style: "currency",
              })}
              footer={`${formatValue(debt.usdPrice, {
                maximumFractionDigits: 2,
              })} ${debt.token.symbol}`}
              extra={
                futurePosition && Number(debtInput) !== 0
                  ? formatValue(futurePosition.debt.amount * debt.usdPrice, {
                      style: "currency",
                    })
                  : undefined
              }
            />

            <PositionCardGradItem
              title="Liquidation Price"
              amount={
                liquidationDiff >= 0
                  ? formatValue(liquidationPrice, { style: "currency" })
                  : "$0"
              }
              footer={
                liquidationDiff >= 0
                  ? `~${liquidationDiff.toFixed(0)}% below current price`
                  : `n/a`
              }
              value={liquidationDiff}
              extra={
                futurePosition &&
                (Number(collateralInput) !== 0 || Number(debtInput) !== 0)
                  ? formatValue(futurePosition.liquidationPrice, {
                      style: "currency",
                    })
                  : undefined
              }
            />
            <PositionCardGradItem
              title="Current Price"
              amount={formatValue(collateral.usdPrice, { style: "currency" })}
              footer={collateral.token.symbol}
            />
          </Grid>

          <Divider sx={{ mb: 1.5 }} />

          <LTVProgressBar
            borrowLimit={0} // TODO: should be dynamic
            value={dynamicLtv > ltvMax ? ltvMax : dynamicLtv}
            maxLTV={ltvMax}
            recommendedLTV={recommendedLTV(ltvMax)}
          />

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Typography variant="body2">Details</Typography>

          <br />

          <Grid container justifyContent="space-between">
            <Typography variant="smallDark">Current Loan-to-Value</Typography>

            <Typography variant="small">
              {dynamicLtv <= 100 ? `${dynamicLtv}%` : "n/a"}
            </Typography>
          </Grid>

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Grid container justifyContent="space-between">
            <Typography variant="smallDark">
              LTV liquidation threshold
            </Typography>

            <Typography variant="small">{dynamicLtvThreshold}%</Typography>
          </Grid>

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography variant="smallDark">
                Collateral will be deposited into
              </Typography>
            </Grid>
            <Grid item>
              {providers?.length ? (
                <Grid container alignItems="center">
                  <NetworkIcon
                    network={vault?.chainId || ""}
                    height={18}
                    width={18}
                  />

                  <Typography ml="0.375rem" variant="small">
                    {providers.find((p) => p.active)?.name}
                  </Typography>
                </Grid>
              ) : (
                "n/a"
              )}
            </Grid>
          </Grid>

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Grid container justifyContent="space-between">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography variant="smallDark">Borrow Interest (APR)</Typography>
              <Tooltip
                arrow
                title="APR, or annual percentage rate, represents the price you pay to borrow money."
              >
                <InfoOutlinedIcon
                  sx={{
                    ml: "0.4rem",
                    fontSize: "0.875rem",
                    color: palette.info.dark,
                    display: { xs: "none", sm: "inline" },
                  }}
                />
              </Tooltip>
              <ClickableTooltip
                title="APR, or annual percentage rate, represents the price you pay to borrow money."
                placement="bottom"
              >
                <InfoOutlinedIcon
                  sx={{
                    ml: "0.4rem",
                    fontSize: "0.875rem",
                    color: palette.info.dark,
                  }}
                />
              </ClickableTooltip>
            </div>
            <Box sx={{ alignItems: "center", cursor: "pointer" }}>
              {providers?.length ? (
                <Typography variant="small">
                  {providers[0].name}:{" "}
                  <span style={{ color: palette.success.main }}>
                    {(
                      parseFloat(formatUnits(providers[0].borrowRate, 27)) * 100
                    ).toFixed(2)}
                    %
                  </span>
                </Typography>
              ) : (
                "n/a"
              )}
            </Box>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default Overview
