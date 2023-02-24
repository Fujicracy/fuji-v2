import React, { useState } from "react"
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

import CurrencyCard from "./CurrencyCard"
import LTVProgressBar from "./LTVProgressBar"

import ClickableTooltip from "../../Shared/ClickableTooltip"
import { useBorrow } from "../../../store/borrow.store"
import { NetworkIcon } from "../../Shared/Icons"
import VaultsMenu from "./VaultsMenu"
import { recommendedLTV } from "../../../helpers/borrow"
import { formatValue } from "../../../helpers/values"
import { Position } from "../../../store/models/Position"

type OverviewProps = {
  position: Position
  futurePosition?: Position
}

export default function Overview({ position, futurePosition }: OverviewProps) {
  const { palette } = useTheme()
  const { collateral, debt, ltv, ltvMax, ltvThreshold } = position

  // NOTE: `viewFuturePosition` will essentially return all the info
  // needed for the overview. But need to pass arguments differently

  // TODO: Both ltv and liquidation need to be updated like collateral and debt
  // const { ltv, ltvMax, ltvThreshold } = useBorrow((state) => state.ltv)
  const { liquidationPrice, liquidationDiff } = useBorrow(
    (state) => state.liquidationMeta
  )

  const allProviders = useBorrow((state) => state.allProviders)
  const vault = useBorrow((state) => state.activeVault)
  const providers =
    allProviders && vault ? allProviders[vault.address.value] : []

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
            <Grid item xs={6}>
              <CurrencyCard
                title="Collateral Provided"
                amount={`${formatValue(collateral.amount, {
                  maximumFractionDigits: 3,
                })} ${collateral.token.symbol}`}
                footer={formatValue(collateral.amount * collateral.usdValue, {
                  style: "currency",
                })}
                // extra={collateral.estimate?.amount} // TODO: not even the right field?
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                title="Borrowed Value"
                amount={formatValue(debt.amount * debt.usdValue, {
                  style: "currency",
                })}
                footer={`${formatValue(debt.usdValue, {
                  maximumFractionDigits: 2,
                })} ${debt.token.symbol}`}
                // extra={debt.estimate?.amount} // TODO: debt.estimate?.amount
              />
            </Grid>

            <Grid item xs={6}>
              <CurrencyCard
                title="Liquidation Price"
                amount={
                  liquidationDiff >= 0
                    ? formatValue(liquidationPrice, { style: "currency" })
                    : "$0"
                }
                footer={
                  liquidationDiff >= 0
                    ? `~${liquidationDiff}% below current price`
                    : `n/a`
                }
                value={liquidationDiff}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                title="Current Price"
                amount={formatValue(collateral.usdValue, { style: "currency" })}
                footer={collateral.token.symbol}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 1.5 }} />

          <LTVProgressBar
            borrowLimit={0} // TODO: should be dynamic
            value={ltv > ltvMax ? ltvMax : ltv}
            maxLTV={ltvMax}
            recommendedLTV={recommendedLTV(ltvMax)}
          />

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Typography variant="body2">Details</Typography>

          <br />

          <Grid container justifyContent="space-between">
            <Typography variant="smallDark">Current Loan-to-Value</Typography>

            <Typography variant="small">
              {ltv <= 100 ? `${ltv}%` : "n/a"}
            </Typography>
          </Grid>

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Grid container justifyContent="space-between">
            <Typography variant="smallDark">
              LTV liquidation threshold
            </Typography>

            <Typography variant="small">{ltvThreshold}%</Typography>
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
