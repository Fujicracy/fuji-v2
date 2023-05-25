import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { linearGradientDef } from '@nivo/core';
import { LineSvgProps, ResponsiveLine } from '@nivo/line';
import { AprResult } from '@x-fuji/sdk';
import React from 'react';

import { ChartTab, normalizeChartData, Period } from '../../../helpers/charts';
import APYChartTooltip from '../../Borrow/Analytics/APYChartTooltip';

type APYChartProps = {
  data: AprResult[];
  period: Period;
  tab: ChartTab;
};

function APYChart({ data, period, tab }: APYChartProps) {
  const { palette } = useTheme();

  const normalizedData = normalizeChartData(data, tab, period);

  const config: LineSvgProps = {
    data: normalizedData,
    layers: ['markers', 'areas', 'crosshair', 'lines', 'axes', 'mesh'],
    defs: [
      linearGradientDef('gradientA', [
        { offset: 0, color: '#4556DC', opacity: 1 },
        { offset: 70, color: 'white', opacity: 0.3 },
        { offset: 100, color: 'white', opacity: 0 },
      ]),
    ],
    fill: [{ match: '*', id: 'gradientA' }],
    margin: { top: 0, right: 10, bottom: 50, left: 30 },
    xScale: { type: 'point' },
    yScale: { type: 'linear', min: 0, max: 'auto' },
    enableArea: true,
    areaOpacity: 0.2,
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
    },
    theme: {
      axis: {
        ticks: {
          text: {
            fill: palette.info.main, // set the tick text color
          },
        },
      },
      crosshair: {
        line: {
          stroke: '#FFFFFF',
          strokeWidth: 2,
          strokeOpacity: 0.5,
          strokeDasharray: '2 2',
        },
      },
    },
    colors: { scheme: 'paired' },
    lineWidth: 2,
    pointSize: 4,
    pointColor: { theme: 'background' },
    pointBorderWidth: 2,
    pointBorderColor: { from: 'serieColor' },
    useMesh: true,
    crosshairType: 'x',
    animate: true,
    curve: 'linear',
  };

  return (
    <Box width="100%" height={400}>
      <ResponsiveLine
        {...config}
        tooltip={({ point }) => {
          return <APYChartTooltip point={point} />;
        }}
      />
    </Box>
  );
}

export default APYChart;
