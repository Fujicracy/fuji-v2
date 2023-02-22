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
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { formatUnits } from "ethers/lib/utils"

import { useBorrow } from "../../store/borrow.store"
import LTVProgressBar from "./Overview/LTVProgressBar"
import ClickableTooltip from "../Shared/ClickableTooltip"
import { ProviderIcon } from "../Shared/Icons"
import { recommendedLTV } from "../../helpers/borrow"
import { formatValue } from "../../helpers/values"

export default function TransactionSummary() {
  const { palette } = useTheme()

  const ltv = useBorrow((state) => state.ltv)
  const ltvMax = useBorrow((state) => state.ltvMax)
  const liquidationPrice = useBorrow((state) => state.liquidationPrice)
  const liquidationDiff = useBorrow((state) => state.liquidationDiff)

  const collateral = useBorrow((state) => state.collateral)
  const debt = useBorrow((state) => state.debt)

  const allProviders = useBorrow((state) => state.allProviders)
  const vault = useBorrow((state) => state.activeVault)
  const providers =
    allProviders && vault ? allProviders[vault.address.value] : []

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
                  <Typography variant="small" sx={{ width: "100%" }}>
                    {formatValue(collateral.amount)} {collateral.token.symbol}{" "}
                    (~
                    {formatValue(collateral.amount * collateral.usdValue)})
                  </Typography>
                </Grid>

                <Grid
                  item
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="smallDark">Borrowed Value</Typography>
                  <Typography variant="small" sx={{ width: "100%" }}>
                    ${formatValue(debt.amount * debt.usdValue)} (
                    {formatValue(debt.amount)} {debt.token.symbol})
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
                  <Typography variant="small" sx={{ width: "100%" }}>
                    ${formatValue(collateral.usdValue)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mt: "1.25rem", mb: "0.5rem" }} />

              <LTVProgressBar
                borrowLimit={0} // TODO: should be dynamic
                value={ltv > ltvMax ? ltvMax : ltv}
                maxLTV={ltvMax}
                recommendedLTV={recommendedLTV(ltvMax)}
              />

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
                    {providers?.length ? (
                      <Grid container alignItems="center">
                        <ProviderIcon
                          providerName={providers[0].name}
                          height={18}
                          width={18}
                        />
                        <Typography ml="0.375rem" variant="small">
                          {providers[0].name}
                        </Typography>
                      </Grid>
                    ) : (
                      "n/a"
                    )}
                  </Grid>
                </Grid>

                <Grid item>
                  <Grid container justifyContent="space-between">
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="smallDark">
                        Borrow Interest (APR)
                      </Typography>

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
                    <Box>
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
