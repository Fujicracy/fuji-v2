import React, { useState } from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import LTVProgressBar from "./LTVProgressBar"
import ClickableTooltip from "../Layout/ClickableTooltip"

export default function TransactionSummary() {
  const { palette } = useTheme()
  const [showProvider, setShowProvider] = useState(false)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const openPreviewTransaction = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget)

  const closePreviewTransaction = () => setAnchorEl(null)

  return (
    <Container>
      <Grid container alignItems="center" justifyContent="space-between">
        <Card
          sx={{
            width: "90%",
            padding: "1rem 1rem",
            position: "fixed",
            bottom: "2rem",
            left: "1.25rem",
            pb: "1rem",
          }}
        >
          <CardContent sx={{ p: 0, width: "100%" }}>
            <CardActionArea onClick={openPreviewTransaction}>
              <Grid container justifyContent="space-between">
                <Typography onClick={openPreviewTransaction} variant="body">
                  Transaction Summary
                </Typography>

                {isOpen ? (
                  <KeyboardArrowDownIcon
                    sx={{
                      border: "1px solid",
                      borderRadius: "0.5rem",
                    }}
                  />
                ) : (
                  <KeyboardArrowUpIcon
                    sx={{
                      border: "1px solid",
                      borderRadius: "0.5rem",
                    }}
                  />
                )}
              </Grid>
            </CardActionArea>
          </CardContent>
        </Card>

        <Dialog
          fullWidth
          onClose={closePreviewTransaction}
          open={isOpen}
          sx={{
            backdropFilter: "blur(0.313rem)",
          }}
        >
          <DialogContent
            sx={{
              position: "fixed",
              bottom: "2rem",
              left: "50%",
              width: "94%",
              maxHeight: "90%",
              transform: "translateX(-50%)",
              background: "transparent",
            }}
          >
            <Card
              sx={{
                flexDirection: "column",
                alignItems: "center",
                padding: "1rem 1rem",
              }}
            >
              <CardContent sx={{ width: "100%", p: 0, gap: "1rem" }}>
                <CardActionArea onClick={closePreviewTransaction}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body2">Transaction Summary</Typography>
                    {isOpen ? (
                      <KeyboardArrowDownIcon
                        sx={{
                          border: "1px solid",
                          borderRadius: "0.5rem",
                        }}
                      />
                    ) : (
                      <KeyboardArrowUpIcon
                        sx={{
                          border: "1px solid",
                          borderRadius: "0.5rem",
                        }}
                      />
                    )}
                  </Grid>
                </CardActionArea>

                <Divider sx={{ mt: "1.375rem", mb: "1rem" }} />

                <Grid container direction="column" rowSpacing="0.75rem">
                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">
                      Collateral Provided
                    </Typography>
                    <Typography variant="small">1ETH (~1800.00)</Typography>
                  </Grid>

                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">Borrowed Value</Typography>
                    <Typography variant="small">$675.00 (675 USDC)</Typography>
                  </Grid>

                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">
                      Liquidation Price
                    </Typography>
                    <Typography variant="small">
                      $1500.00 (
                      <span
                        style={{
                          color: palette.success.main,
                        }}
                      >
                        ~25%
                      </span>{" "}
                      below)
                    </Typography>
                  </Grid>

                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">
                      Current Price (ETH)
                    </Typography>
                    <Typography variant="small">$2000.00</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ mt: "1.25rem", mb: "0.5rem" }} />

                <LTVProgressBar borrowLimit={0} value={40} />

                <Divider sx={{ mt: "1rem", mb: "1.5rem" }} />

                <Typography variant="body2">Details</Typography>

                <br />

                <Grid container direction="column" rowSpacing="0.75rem">
                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">Current LTV</Typography>
                    <Typography variant="small">45%</Typography>
                  </Grid>

                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">
                      Liquidation threshold
                    </Typography>
                    <Typography variant="small">75%</Typography>
                  </Grid>

                  <Grid
                    item
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="smallDark">
                      Collateral will be deposit into
                    </Typography>

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

                  <Grid item>
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
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </Grid>
    </Container>
  )
}
