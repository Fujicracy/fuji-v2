import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PointTooltipProps } from '@nivo/line';
import React from 'react';

const APYChartTooltip = ({ point }: PointTooltipProps) => {
  const { palette } = useTheme();

  const { date, aprBase, aprReward } = point.data as any;

  const renderValue = (title: string, value: number) => (
    <Stack
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Typography variant="small">{title}</Typography>
      <Typography variant="small" fontWeight={700} color={palette.success.main}>
        {value.toFixed(2)}%
      </Typography>
    </Stack>
  );

  return (
    <Box
      sx={{
        width: '16rem',
        background: palette.secondary.dark,
        p: '0.75rem 1rem',
        borderRadius: '0.5rem',
      }}
    >
      <Typography variant="small">{point.serieId}</Typography>
      {renderValue('Base APR', aprBase)}
      {renderValue('Reward APR', aprReward)}
      <Typography variant="small" mt="0.5rem">
        {date}
      </Typography>
    </Box>
  );
};

export default APYChartTooltip;
