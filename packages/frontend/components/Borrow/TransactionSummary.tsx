import React from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import Image from "next/image"

import LTVProgressBar from "./LTVProgressBar"
import ClickableTooltip from "../Layout/ClickableTooltip"
import { useLiquidationPrice, useLtv } from "../../store/transaction.slice"
import { useStore } from "../../store"

export default function TransactionSummary() {
  const { palette } = useTheme()

  const ltv = useLtv()
  const { liquidationPrice, liquidationDiff } = useLiquidationPrice(75)
  const collateral = useStore((state) => state.collateral)
  const borrow = useStore((state) => state.borrow)

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const openPreviewTransaction = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget)

  const closePreviewTransaction = () => setAnchorEl(null)

  return (
    <>
      <Card
        sx={{
          width: "88%",
          padding: "1rem 1rem",
          position: "fixed",
          bottom: "2rem",
          left: "6%",
          right: "6%",
          pb: 0,
        }}
      >
        <CardContent sx={{ p: 0, width: "100%" }}>
          <CardActionArea onClick={openPreviewTransaction}>
            <Grid container justifyContent="space-between">
              <Typography onClick={openPreviewTransaction} variant="body2">
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
        sx={{ backdropFilter: "blur(0.313rem)" }}
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
                  <Typography variant="small">
                    {collateral.value.toLocaleString()}{" "}
                    {collateral.token.symbol} (~
                    {(
                      collateral.value * collateral.tokenValue
                    ).toLocaleString()}
                    )
                  </Typography>
                </Grid>

                <Grid
                  item
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="smallDark">Borrowed Value</Typography>
                  <Typography variant="small">
                    ${(borrow.value * borrow.tokenValue).toLocaleString()} (
                    {borrow.value.toLocaleString()} {borrow.token.symbol})
                  </Typography>
                </Grid>

                <Grid
                  item
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="smallDark">Liquidation Price</Typography>
                  <Typography variant="small">
                    ${liquidationPrice} (
                    <span
                      style={{
                        color:
                          liquidationDiff >= 0
                            ? palette.success.main
                            : palette.error.main,
                      }}
                    >
                      ~{Math.abs(liquidationDiff)}%
                    </span>{" "}
                    {liquidationDiff >= 0 ? "below" : "above"})
                  </Typography>
                </Grid>

                <Grid item display="flex" justifyContent="space-between">
                  <Typography variant="smallDark">
                    Current Price ({collateral.token.symbol})
                  </Typography>
                  <Typography variant="small">
                    ${collateral.tokenValue.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mt: "1.25rem", mb: "0.5rem" }} />

              <LTVProgressBar borrowLimit={0} value={ltv} />

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
                      <Typography ml="0.375rem" variant="small">
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
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  )
}
