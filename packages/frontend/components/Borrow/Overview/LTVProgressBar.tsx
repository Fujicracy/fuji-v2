import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { ClickableTooltip } from '../../Shared/Tooltips';
import InfoTooltip from '../../Shared/Tooltips/InfoTooltip';

type LTVProgressBarProps = {
  borrowLimit: number;
  value: number;
  maxLTV: number;
  recommendedLTV: number;
  isMobile: boolean;
};

function LTVProgressBar({
  borrowLimit,
  value,
  maxLTV,
  recommendedLTV,
  isMobile,
}: LTVProgressBarProps) {
  const { palette } = useTheme();

  const percentageMargin = `${
    value < 5 ? 0 : value > maxLTV ? value : (value * 100) / maxLTV - 5
  }%`;

  return (
    <LTVProgressBarContainer isMobile={isMobile}>
      <Box>
        <Grid
          container
          sx={{
            ml: '3rem',
          }}
        >
          <Grid item margin="auto">
            <Stack direction="row" alignItems="center">
              <InfoTooltip
                title="Being in this area keeps you safe from sudden shifts in the market."
                isLeft
              />

              <ClickableTooltip
                title="Being in this area keeps you safe from sudden shifts in the market."
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: '0.313rem',
                    fontSize: '0.875rem',
                  }}
                />
              </ClickableTooltip>
              <Typography
                data-cy="recommended-ltv-percent"
                variant="xsmall"
                sx={{ display: { xs: 'none', sm: 'inline' } }}
              >
                {recommendedLTV}% LTV (Recommended)
              </Typography>

              <Typography
                variant="xsmall"
                sx={{ display: { xs: 'inline', sm: 'none' } }}
              >
                SAFE LTV: {recommendedLTV}%
              </Typography>
            </Stack>
          </Grid>
          <Grid item marginRight="3rem">
            <Stack direction="row" alignItems="center">
              <InfoTooltip
                title={
                  "Maximum portion of collateral value that can be borrowed. It's advisable not to exceed this threshold as you might be at risk of liquidation."
                }
                isLeft
              />

              <ClickableTooltip
                title="Maximum portion of collateral value that can be borrowed. It's advisable not to exceed this threshold as you might be at risk of liquidation."
                placement="top"
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: '0.313rem',
                    fontSize: '0.875rem',
                  }}
                />
              </ClickableTooltip>

              <Typography
                data-cy="max-ltv-percent"
                variant="xsmall"
                sx={{ display: { xs: 'none', sm: 'inline' } }}
              >
                {maxLTV}% LTV (MAX)
              </Typography>

              <Typography
                variant="xsmall"
                sx={{ display: { xs: 'inline', sm: 'none' } }}
              >
                MAX LTV: {maxLTV}%
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Grid container>
          <Divider
            sx={{
              height: '0.813rem',
              borderRight: `0.063rem solid`,
              borderBottom: 0,
              width: `${(recommendedLTV * 100) / maxLTV}%`,
              margin: 0,
            }}
          />
          <Divider
            sx={{
              height: '0.813rem',
              borderRight: `0.063rem solid`,
              borderBottom: 0,
              width: `${100 - (recommendedLTV * 100) / maxLTV}%`,
              margin: 0,
            }}
          />
        </Grid>

        <LinearProgress
          data-cy="ltv-progress-line"
          sx={{
            borderRadius: '1.25rem',
            background: palette.background.default,
            height: '0.5rem',
            marginBottom: '0.5rem',
            '& .MuiLinearProgress-barColorPrimary': {
              backgroundColor:
                value <= recommendedLTV
                  ? palette.success.main
                  : palette.warning.main,
              borderRadius: '1.25rem',
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
            display: { xs: 'block', sm: 'none' },
          }}
        >
          {value.toFixed(0)}%
        </Typography>

        <Grid
          container
          justifyContent="space-between"
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant="xsmall">LTV</Typography>
            <InfoTooltip title="The amount you borrow divided by the amount of collateral you provide is known as your Loan To Value ratio." />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <InfoTooltip
              title="Maximum USD value borrowable based on the collaterals you have provided."
              isLeft
            />
            <Typography variant="xsmall">
              Borrow Limit: ${borrowLimit.toFixed(2)}
            </Typography>
          </div>
        </Grid>
      </Box>
    </LTVProgressBarContainer>
  );
}

export default LTVProgressBar;

type LTVProgressBarContainerProps = {
  children: React.ReactNode;
  isMobile: boolean;
};

function LTVProgressBarContainer({
  children,
  isMobile,
}: LTVProgressBarContainerProps) {
  return (
    <>
      <Divider sx={isMobile ? { mt: 2, mb: 1.5 } : { mb: 1.5 }} />
      {children}
    </>
  );
}
