import React from "react"
import { useTheme } from "@mui/material/styles"
import {
  Box,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import ClickableTooltip from "../Layout/ClickableTooltip"

type LTVProgressBarProps = {
  borrowLimit: number
  value: number
}

export default function LTVProgressBar(props: LTVProgressBarProps) {
  const { palette } = useTheme()

  return (
    <Box>
      <Grid
        container
        sx={{
          marginLeft: "3rem",
        }}
      >
        <Grid item alignItems="center" margin="auto">
          <Tooltip
            title="Being in this area keeps you safe from sudden shifts in the market."
            placement="top"
          >
            <InfoOutlinedIcon
              sx={{
                marginRight: "0.313rem",
                fontSize: "0.875rem",
                display: { xs: "none", sm: "inline" },
              }}
            />
          </Tooltip>
          <ClickableTooltip
            title="Being in this area keeps you safe from suddent shifts in the market."
            placement="top"
          >
            <InfoOutlinedIcon
              sx={{
                marginRight: "0.313rem",
                fontSize: "0.875rem",
              }}
            />
          </ClickableTooltip>
          <Typography
            variant="xsmall"
            sx={{ display: { xs: "none", sm: "inline" } }}
          >
            45% LTV (Recommended)
          </Typography>

          <Typography
            variant="xsmall"
            sx={{ display: { xs: "inline", sm: "none" } }}
          >
            SAFE LTV: 45%
          </Typography>
        </Grid>
        <Grid item alignItems="center" marginRight="3rem">
          <Tooltip
            title="This area is dangerous, if you exceed this threshold you can get liquidated."
            placement="top"
          >
            <InfoOutlinedIcon
              sx={{
                marginRight: "0.313rem",
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
                marginRight: "0.313rem",
                fontSize: "0.875rem",
              }}
            />
          </ClickableTooltip>

          <Typography
            variant="xsmall"
            sx={{ display: { xs: "none", sm: "inline" } }}
          >
            75% LTV (MAX)
          </Typography>

          <Typography
            variant="xsmall"
            sx={{ display: { xs: "inline", sm: "none" } }}
          >
            MAX LTV: 75%
          </Typography>
        </Grid>
      </Grid>

      <Grid container>
        <Divider
          sx={{
            height: "0.813rem",
            borderRight: `0.063rem solid`,
            borderBottom: 0,
            width: "60%",
            margin: 0,
          }}
        />
        <Divider
          sx={{
            height: "0.813rem",
            borderRight: `0.063rem solid`,
            borderBottom: 0,
            width: "40%",
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
          ".css-uu0lzf-MuiLinearProgress-bar1": {
            background:
              props.value <= 45 ? palette.success.main : palette.warning.main,
            borderRadius: "1.25rem",
          },
        }}
        value={props.value > 75 ? props.value : (props.value * 100) / 75}
        variant="determinate"
      />

      <Typography
        variant="label"
        color="success.main"
        sx={{
          marginLeft: `${
            (props.value > 75 ? props.value : (props.value * 100) / 75) - 5
          }%`,
          display: { xs: "block", sm: "none" },
        }}
      >
        {props.value}%
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
          <Tooltip title="Loan-To-Value -- a financial ratio that compares the amount of money being borrowed to the market price of the collateral.">
            <InfoOutlinedIcon
              sx={{
                marginLeft: "0.313rem",
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
          <Tooltip title="The maximum amount of borrowing power based on you collateral's market price.">
            <InfoOutlinedIcon
              sx={{
                marginRight: "0.313rem",
                fontSize: "0.875rem",
              }}
            />
          </Tooltip>
          <Typography variant="xsmall">
            Borrow Limit: ${props.borrowLimit.toFixed(2)}
          </Typography>
        </div>
      </Grid>
    </Box>
  )
}
