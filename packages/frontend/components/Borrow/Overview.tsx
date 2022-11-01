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
import AddCircleIcon from "@mui/icons-material/AddCircle"

import CurrencyCard from "./CurrencyCard"
import LTVProgressBar from "./LTVProgressBar"
import Image from "next/image"
import ClickableTooltip from "../Layout/ClickableTooltip"
import { useStore } from "../../store"
import { useLiquidationPrice, useLtv } from "../../store/transaction.slice"

export default function Overview() {
  const { palette } = useTheme()
  const ltv = useLtv()
  const { liquidationPrice, liquidationDiff } = useLiquidationPrice(75)
  const collateral = useStore((state) => ({
    ...state.collateral,
    value: parseFloat(state.collateral.value),
  }))
  const borrow = useStore((state) => ({
    ...state.borrow,
    value: parseFloat(state.borrow.value),
  }))

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
                  amount: `${collateral.value.toLocaleString()} ${
                    collateral.token.symbol
                  }`,
                  footer: `${(
                    collateral.value * collateral.tokenValue
                  ).toLocaleString()} USD`,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Borrowed Value",
                  amount: `${(
                    borrow.value * borrow.tokenValue
                  ).toLocaleString()} USD`,
                  footer: `${borrow.value.toLocaleString()} ${
                    borrow.token.symbol
                  }`,
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Liquidation Price",
                  amount: `$${liquidationPrice.toLocaleString()}`,
                  footer:
                    liquidationDiff >= 0
                      ? `~${liquidationDiff}% below current price`
                      : `~${Math.abs(liquidationDiff)}% above current price`,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: "Current Price",
                  amount: `$${collateral.tokenValue.toLocaleString()}`,
                  footer: `${collateral.token.symbol}`,
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 1.5 }} />

          <LTVProgressBar
            borrowLimit={0}
            value={ltv > 100 ? 100 : ltv}
            maxLTV={100} // TODO: Should be dynamic thanks to SDK method
            recommendedLTV={45} // TODO: Should be dynamic thanks to SDK method
          />

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Typography variant="body2">Details</Typography>

          <br />

          <Grid container justifyContent="space-between">
            <Typography variant="smallDark">Current Loan-to-Value</Typography>

            <Typography variant="small">{ltv}%</Typography>
          </Grid>

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Grid container justifyContent="space-between">
            <Typography variant="smallDark">
              LTV liquidation threshold
            </Typography>

            <Typography variant="small">75%</Typography>
          </Grid>

          <Divider sx={{ mt: 2, mb: 2 }} />

          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography variant="smallDark">
                Collateral will be deposit into
              </Typography>
            </Grid>
            <Grid item>
              <Grid container alignItems="center">
                <Image
                  src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
                  height={18}
                  width={18}
                  alt="Ethereum icon"
                />
                <Typography ml="0.375rem" variant="small">
                  Aave V2
                </Typography>
              </Grid>
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
            <Box>
              <Box sx={{ alignItems: "center", cursor: "pointer" }}>
                <Typography variant="small">
                  Aave:{" "}
                  <span
                    style={{
                      color: palette.success.main,
                    }}
                  >
                    1.83%
                  </span>
                  <Divider
                    sx={{
                      marginLeft: "0.531rem",
                      marginRight: "0.25rem",
                      borderRight: `0.063rem solid ${palette.text.secondary}`,
                      borderBottom: 0,
                      display: "inline",
                    }}
                  />
                </Typography>
                <AddCircleIcon
                  sx={{
                    marginLeft: "0.25rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  )
}
