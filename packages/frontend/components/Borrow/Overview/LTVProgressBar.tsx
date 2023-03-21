import React from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
  Stack,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { ClickableTooltip } from "../../Shared/Tooltips"

type LTVProgressBarProps = {
  borrowLimit: number
  value: number
  maxLTV: number
  recommendedLTV: number
  isMobile: boolean
}

function LTVProgressBar({
  borrowLimit,
  value,
  maxLTV,
  recommendedLTV,
  isMobile,
}: LTVProgressBarProps) {
  const { palette } = useTheme()

  const percentageMargin = `${
    value < 5 ? 0 : value > maxLTV ? value : (value * 100) / maxLTV - 5
  }%`

  return (
    <LTVProgressBarContainer isMobile={isMobile}>
      <Box>
        <Grid
          container
          sx={{
            ml: "3rem",
          }}
        >
          <Grid item margin="auto">
            <Stack direction="row" alignItems="center">
              <Tooltip
                title="Being in this area keeps you safe from sudden shifts in the market."
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: "0.313rem",
                    fontSize: "0.875rem",
                    display: { xs: "none", sm: "inline" },
                  }}
                />
              </Tooltip>

              <ClickableTooltip
                title="Being in this area keeps you safe from sudden shifts in the market."
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: "0.313rem",
                    fontSize: "0.875rem",
                  }}
                />
              </ClickableTooltip>
              <Typography
                variant="xsmall"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {recommendedLTV}% LTV (Recommended)
              </Typography>

              <Typography
                variant="xsmall"
                sx={{ display: { xs: "inline", sm: "none" } }}
              >
                SAFE LTV: {recommendedLTV}%
              </Typography>
            </Stack>
          </Grid>
          <Grid item marginRight="3rem">
            <Stack direction="row" alignItems="center">
              <Tooltip
                title="This area is dangerous, if you exceed this threshold you can get liquidated."
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: "0.313rem",
                    fontSize: "0.875rem",
                    display: { xs: "none", sm: "inline" },
                  }}
                />
              </Tooltip>
              <ClickableTooltip
                title="This area is dangerous, if you exceed this threshold you can get liquidated."
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: "0.313rem",
                    fontSize: "0.875rem",
                  }}
                />
              </ClickableTooltip>

              <Typography
                variant="xsmall"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {maxLTV}% LTV (MAX)
              </Typography>

              <Typography
                variant="xsmall"
                sx={{ display: { xs: "inline", sm: "none" } }}
              >
                MAX LTV: {maxLTV}%
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Grid container>
          <Divider
            sx={{
              height: "0.813rem",
              borderRight: `0.063rem solid`,
              borderBottom: 0,
              width: `${(recommendedLTV * 100) / maxLTV}%`,
              margin: 0,
            }}
          />
          <Divider
            sx={{
              height: "0.813rem",
              borderRight: `0.063rem solid`,
              borderBottom: 0,
              width: `${100 - (recommendedLTV * 100) / maxLTV}%`,
              margin: 0,
            }}
          />
        </Grid>

        <LinearProgress
          sx={{
            borderRadius: "1.25rem",
            background: palette.background.default,
            height: "0.5rem",
            marginBottom: "0.5rem",
            "& .MuiLinearProgress-barColorPrimary": {
              backgroundColor:
                value <= recommendedLTV
                  ? palette.success.main
                  : palette.warning.main,
              borderRadius: "1.25rem",
            },
          }}
          value={value > maxLTV ? 100 : (value * 100) / maxLTV}
          variant="determinate"
        />

        <Typography
          variant="label"
          color="success.main"
          ml={percentageMargin}
          sx={{
            display: { xs: "block", sm: "none" },
          }}
        >
          {value}%
        </Typography>

        <Grid
          container
          justifyContent="space-between"
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography variant="xsmall">LTV</Typography>
            <Tooltip
              arrow
              title="Loan-To-Value -- a financial ratio that compares the amount of money being borrowed to the market price of the collateral."
            >
              <InfoOutlinedIcon
                sx={{
                  ml: "0.313rem",
                  fontSize: "0.875rem",
                  display: { xs: "none", sm: "inline" },
                }}
              />
            </Tooltip>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Tooltip
              arrow
              title="The maximum amount of borrowing power based on you collateral's market price."
            >
              <InfoOutlinedIcon
                sx={{
                  mr: "0.313rem",
                  fontSize: "0.875rem",
                }}
              />
            </Tooltip>
            <Typography variant="xsmall">
              Borrow Limit: ${borrowLimit.toFixed(2)}
            </Typography>
          </div>
        </Grid>
      </Box>
    </LTVProgressBarContainer>
  )
}

export default LTVProgressBar

type LTVProgressBarContainerProps = {
  children: React.ReactNode
  isMobile: boolean
}

export function LTVProgressBarContainer({
  children,
  isMobile,
}: LTVProgressBarContainerProps) {
  return (
    <>
      <Divider sx={isMobile ? { mt: 2, mb: 1.5 } : { mb: 1.5 }} />
      {children}
      <Divider sx={{ mt: 2, mb: 2 }} />
    </>
  )
}
