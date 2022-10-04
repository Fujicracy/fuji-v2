import React, { useState } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

import CurrencyCard from "./CurrencyCard"
import LTVProgressBar from "./LTVProgressBar"
import Image from "next/image"

export default function Overview() {
  const theme = useTheme()
  const [showProvider, setShowProvider] = useState(false)

  return (
    <Container
      sx={{
        pl: { xs: "0.25rem", sm: "1rem" },
        pr: { xs: "0.25rem", sm: "1rem" },
      }}
    >
      <p>
        Current state: <code>...</code>
      </p>

      <Grid container alignItems="center" justifyContent="space-between">
        {/* <Dialog
          fullWidth
          onClose={() => {}}
          open={true}
          maxWidth="xs"
          sx={{
            backdropFilter: "blur(0.313rem)",
          }}
        >
          <DialogTitle>Preview Transaction</DialogTitle>
          <DialogContent>Example Content Here</DialogContent>
        </Dialog> */}
        <Accordion sx={{ display: { xs: "block", sm: "none" }, mb: "2rem" }}>
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  border: "1px solid",
                  borderRadius: "0.5rem",
                }}
              />
            }
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography variant="body2">Preview Transaction</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Divider sx={{ mb: "1.5rem" }} />

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Collateral Provided</Typography>
              <Typography variant="small">0ETH (0.00 USD)</Typography>
            </Grid>

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Borrowed Value</Typography>
              <Typography variant="small">$0.00 (0 UDCS)</Typography>
            </Grid>

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Liquidation Price</Typography>
              <Typography variant="small">$0.00 (n/a)</Typography>
            </Grid>

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Current Price (ETH)</Typography>
              <Typography variant="small">$2000.00</Typography>
            </Grid>

            <Divider sx={{ mt: "2rem", mb: 1.5 }} />

            <LTVProgressBar borrowLimit={0} value={40} />

            <Divider sx={{ mt: 2, mb: 2 }} />

            <Typography variant="body2">Details</Typography>

            <br />

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Current LTV</Typography>
              <Typography variant="small">45%</Typography>
            </Grid>

            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Liquidation threshold</Typography>

              <Typography variant="small">75%</Typography>
            </Grid>

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

            <Grid container justifyContent="space-between">
              <div style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="smallDark">
                  Borrow Interest (APR)
                </Typography>
                <Tooltip title="???">
                  <InfoOutlinedIcon
                    sx={{
                      ml: "0.4rem",
                      fontSize: "0.875rem",
                      color: theme.palette.info.dark,
                    }}
                  />
                </Tooltip>
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
                        color: theme.palette.success.main,
                      }}
                    >
                      1.83%
                    </span>
                    <Divider
                      sx={{
                        marginLeft: "0.531rem",
                        marginRight: "0.25rem",
                        borderRight: `0.063rem solid ${theme.palette.text.secondary}`,
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
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <span>DForce:</span>
                    <span>3.33%</span>
                  </Typography>
                </Collapse>
              </Box>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Card
          sx={{
            display: { xs: "none", sm: "flex" },
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
                <Tooltip title="???">
                  <InfoOutlinedIcon
                    sx={{
                      ml: "0.4rem",
                      fontSize: "0.875rem",
                      color: theme.palette.info.dark,
                    }}
                  />
                </Tooltip>
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
                        color: theme.palette.success.main,
                      }}
                    >
                      1.83%
                    </span>
                    <Divider
                      sx={{
                        marginLeft: "0.531rem",
                        marginRight: "0.25rem",
                        borderRight: `0.063rem solid ${theme.palette.text.secondary}`,
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
                        color: theme.palette.text.primary,
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

        {/* {showPreviewTransaction ? (
              <KeyboardArrowDownIcon />
            ) : (
              <KeyboardArrowUpIcon />
            )} */}
      </Grid>

      {/* <Collapse in={showPreviewTransaction}> */}

      {/*  </Collapse> */}
    </Container>
  )
}
