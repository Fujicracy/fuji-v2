import React from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { formatUnits } from "ethers/lib/utils"

import CurrencyCard from "./CurrencyCard"
import LTVProgressBar from "./LTVProgressBar"
import TokenIcon from "../TokenIcon"
import ClickableTooltip from "../Layout/ClickableTooltip"
import { useStore } from "../../store"
import { useLiquidationPrice, useLtv } from "../../store/transaction.slice"
import { DEFAULT_LTV_RECOMMENDED } from "../../consts/borrow"

// TODO: create helper to get these images and throw / warn us if 404 ?
const ethIconPath = "/assets/images/protocol-icons/networks/Ethereum.svg"

export default function Overview() {
  const { palette } = useTheme()
  const ltv = useLtv()
  const { ltvMax, ltvThreshold } = useStore((state) => state.position)
  const { liquidationPrice, liquidationDiff } =
    useLiquidationPrice(ltvThreshold)
  const collateral = useStore((state) => state.position.collateral)
  const debt = useStore((state) => state.position.debt)
  const providers = useStore((state) => state.position.providers)

  return (
    <Grid container alignItems="center" justifyContent="space-between">
      <Card
        sx={{
          flexDirection: "column",
          alignItems: "center",
          padding: "1.5rem 2rem",
          width: "100%",
        }}
      >
        <CardContent sx={{ padding: 0, gap: "1rem" }}>
          <Typography variant="body2">Overview</Typography>
          <Divider sx={{ mt: "1rem", mb: "1.5rem" }} />

          <Grid container columnSpacing="1rem">
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Collateral Provided",
                  amount: `${collateral.amount.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })} ${collateral.token.symbol}`,
                  footer: (
                    collateral.amount * collateral.usdValue
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "usd",
                  }),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Borrowed Value",
                  amount: (debt.amount * debt.usdValue).toLocaleString(
                    "en-US",
                    {
                      style: "currency",
                      currency: "usd",
                    }
                  ),
                  footer: `${debt.amount.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })} ${debt.token.symbol}`,
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Liquidation Price",
                  amount:
                    liquidationDiff >= 0
                      ? liquidationPrice.toLocaleString("en-US", {
                          style: "currency",
                          currency: "usd",
                        })
                      : "$0",
                  footer:
                    liquidationDiff >= 0
                      ? `~${liquidationDiff}% below current price`
                      : `n/a`,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Current Price",
                  amount: collateral.usdValue.toLocaleString("en-US", {
                    style: "currency",
                    currency: "usd",
                  }),
                  footer: collateral.token.symbol,
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 1.5 }} />

          <LTVProgressBar
            borrowLimit={0} // TODO: should be dynamic
            value={ltv > ltvMax ? ltvMax : ltv}
            maxLTV={ltvMax}
            recommendedLTV={DEFAULT_LTV_RECOMMENDED} // TODO: Should be dynamic thanks to SDK method
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
                Collateral will be deposit into
              </Typography>
            </Grid>
            <Grid item>
              {providers?.length ? (
                <Grid container alignItems="center">
                  {/* TODO[design]: what logo should i put here ? */}
                  <TokenIcon token={collateral.token} height={18} width={18} />

                  <Typography ml="0.375rem" variant="small">
                    {providers[0].name}
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
              <Tooltip title="APR, or annual percentage rate, represents the price you pay to borrow money.">
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
                    {formatUnits(providers[0].borrowRate, 27)}%
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
