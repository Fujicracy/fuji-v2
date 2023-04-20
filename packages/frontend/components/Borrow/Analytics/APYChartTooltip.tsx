import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PointTooltipProps } from '@nivo/line';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import React from 'react';

const APYChartTooltip = ({ point }: PointTooltipProps) => {
  const { palette } = useTheme();

  const date = (point.data as unknown as { date: string }).date;

  return (
    <Box
      sx={{
        zIndex: 9999,
        width: '16rem',
        background: palette.secondary.dark,
        p: '0.75rem 1rem',
        borderRadius: '0.5rem',
      }}
    >
      <Stack
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">Fuji Vault APY</Typography>
        <Typography
          variant="small"
          fontWeight={700}
          color={palette.success.main}
        >
          {(parseFloat(formatUnits(BigNumber.from('0'), 27)) * 100).toFixed(2)}%
        </Typography>
      </Stack>
      <Stack
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">Other Lending Protocol</Typography>
        <Typography variant="small" fontWeight={700} color={palette.info.dark}>
          {(parseFloat(formatUnits(BigNumber.from('0'), 27)) * 100).toFixed(2)}%
        </Typography>
      </Stack>
      <Typography variant="small" mt="0.5rem">
        {date}
      </Typography>
    </Box>
  );
};

export default APYChartTooltip;
