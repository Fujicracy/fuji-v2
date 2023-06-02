import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { linearGradientDef } from '@nivo/core';
import { LineSvgProps, ResponsiveLine } from '@nivo/line';
import { AprResult } from '@x-fuji/sdk';
import React from 'react';

import {
  ChartTab,
  normalizeChartData,
  Period,
  xAxisValues,
} from '../../../helpers/charts';
import { APYChartTooltip } from '../Tooltips';

type APYChartProps = {
  data: AprResult[];
  period: Period;
  tab: ChartTab;
};

function APYChart({ data, period, tab }: APYChartProps) {
  const { palette } = useTheme();

  const normalizedData = normalizeChartData(data, tab, period);
  const valuesToShow = xAxisValues(normalizedData, period);

  const config: LineSvgProps = {
    data: normalizedData,
    layers: ['markers', 'crosshair', 'lines', 'axes', 'mesh'],
    defs: [
      linearGradientDef('gradientA', [
        { offset: 0, color: '#4556DC', opacity: 1 },
        { offset: 70, color: 'white', opacity: 0.3 },
        { offset: 100, color: 'white', opacity: 0 },
      ]),
    ],
    fill: [{ match: '*', id: 'gradientA' }],
    margin: { top: 10, right: 20, bottom: 35, left: 50 },
    xScale: { type: 'point' },
    yScale: { type: 'linear', min: 'auto', max: 'auto' },
    enableArea: true,
    areaOpacity: 0.2,
    axisBottom: {
      tickSize: 0,
      tickPadding: 5,
      tickRotation: 0,
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      format: ' >-.1%',
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
    animate: false,
    curve: 'monotoneX',
  };

  if (!valuesToShow.length) return null;

  return (
    <Box width="100%" height={400} padding={'1rem 0rem'}>
      <ResponsiveLine
        {...config}
        axisLeft={{
          tickValues: 5,
          format: (v) => `${v}%`,
        }}
        axisBottom={{
          tickValues: valuesToShow,
          format: (v) => `${v.split(',')[0]}`,
        }}
        tooltip={({ point }) => {
          return <APYChartTooltip point={point} />;
        }}
      />
    </Box>
  );
}

export default APYChart;
