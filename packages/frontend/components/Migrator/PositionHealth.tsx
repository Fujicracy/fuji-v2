import { LinearProgress, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

type PositionHealthProps = {
  value: number;
  maxLTV: number;
  recommendedLTV: number;
};

function PositionHealth({
  value,
  maxLTV,
  recommendedLTV,
}: PositionHealthProps) {
  const { palette } = useTheme();
  return (
    <Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="small">Position Health</Typography>
        <Typography variant="small" fontWeight={500}>
          LTV: {value} %
        </Typography>
      </Stack>

      <LinearProgress
        data-cy="ltv-progress-line"
        sx={{
          borderRadius: '1.25rem',
          background: palette.background.default,
          height: '0.5rem',
          marginTop: '0.5rem',
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
    </Stack>
  );
}

export default PositionHealth;
