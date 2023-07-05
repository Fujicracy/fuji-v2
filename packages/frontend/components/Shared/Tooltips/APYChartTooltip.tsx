import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatumValue } from '@nivo/core';
import { PointTooltipProps } from '@nivo/line';
import React from 'react';

type PointData = {
  x: DatumValue;
  xFormatted: string | number;
  yFormatted: string | number;
  yStacked?: number; // All of the above are required nivo properties
  y: number;
  date: string;
  aprBase: number;
  aprReward: number;
};

const APYChartTooltip = ({ point }: PointTooltipProps) => {
  const { palette } = useTheme();

  const { date, aprBase, aprReward, y } = point.data as PointData;

  const renderValue = (title: string, value: number, mb?: string) => (
    <Stack
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mb={mb}
    >
      <Typography variant="small">{title}</Typography>
      <Typography variant="small" fontWeight={700} color={palette.success.main}>
        {value ? value.toFixed(2) : 0}%
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
      <Typography variant="h6">{point.serieId}</Typography>
      {renderValue('Net APR', y)}
      {renderValue('Base', aprBase)}
      {renderValue('Reward', aprReward, '0.5rem')}
      <Typography variant="xsmall">{date}</Typography>
    </Box>
  );
};

export default APYChartTooltip;
