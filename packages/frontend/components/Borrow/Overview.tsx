import React, { useState } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Card,
  CardContent,
  Collapse,
  Container,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import CancelIcon from "@mui/icons-material/Cancel"

import CurrencyCard from "./CurrencyCard"
import LTVProgressBar from "./LTVProgressBar"
import Image from "next/image"
import ClickableTooltip from "../Layout/ClickableTooltip"

export default function Overview() {
  const { palette } = useTheme()
  const [showProvider, setShowProvider] = useState(false)

  return (
    <Container>
      <Grid container alignItems="center" justifyContent="space-between">
        <Card
          sx={{
            flexDirection: "column",
            alignItems: "center",
            padding: "1.5rem 2rem",
          }}
        >
          <CardContent sx={{ width: "100%", padding: 0, gap: "1rem" }}>
            <Typography variant="body2">Overview</Typography>
            <Divider sx={{ mt: "1rem", mb: "1.5rem" }} />

            <Grid container columnSpacing="1rem">
              <Grid item xs={6}>
                <CurrencyCard
                  informations={{
                    title: "Collateral Provided",
                    amount: "0 ETH",
                    footer: "0.00 USD",
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <CurrencyCard
                  informations={{
                    title: "Borrowed Value",
                    amount: "$0.00",
                    footer: "0.00 USDC",
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <CurrencyCard
                  informations={{
                    title: "Liquidation Price",
                    amount: "$0.00",
                    footer: "n/a",
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <CurrencyCard
                  informations={{
                    title: "Current Price",
                    amount: "$2000.00",
                    footer: "ETH",
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 1.5 }} />

            <LTVProgressBar borrowLimit={0} value={45} />

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Typography variant="body2">Details</Typography>

            <br />

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Current Loan-to-Value</Typography>

              <Typography variant="small">45%</Typography>
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
                  <Typography sx={{ ml: "0.375rem" }} variant="small">
                    Aave V2
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Grid container justifyContent="space-between">
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="smallDark">
                  Borrow Interest (APR)
                </Typography>
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
                <Box
                  sx={{ alignItems: "center", cursor: "pointer" }}
                  onClick={() => setShowProvider(!showProvider)}
                >
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
                  {showProvider ? (
                    <CancelIcon
                      sx={{
                        marginLeft: "0.25rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    />
                  ) : (
                    <AddCircleIcon
                      sx={{
                        marginLeft: "0.25rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    />
                  )}
                </Box>
                <Collapse in={showProvider} sx={{ mt: "0.25rem" }}>
                  <Typography
                    variant="smallDark"
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      ":hover": {
                        color: palette.text.primary,
                      },
                    }}
                  >
                    <span>DForce:</span>
                    <span>3.33%</span>
                  </Typography>
                </Collapse>
              </Box>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Container>
  )
}
