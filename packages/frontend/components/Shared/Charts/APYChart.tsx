import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { linearGradientDef } from '@nivo/core';
import { LineSvgProps, ResponsiveLine } from '@nivo/line';
import React from 'react';

import APYChartTooltip from '../../Borrow/Analytics/APYChartTooltip';

const testData = [
  {
    id: 'line1',
    data: [
      { x: 1, y: 0.25, date: 'Mar 10, 2023' },
      { x: 2, y: 0.75, date: 'Mar 10, 2023' },
      { x: 3, y: 0.2, date: 'Mar 10, 2023' },
      { x: 4, y: 0.25, date: 'Mar 10, 2023' },
      { x: 5, y: 0.1, date: 'Mar 10, 2023' },
      { x: 6, y: 0.4, date: 'Mar 10, 2023' },
      { x: 7, y: 0.5, date: 'Mar 10, 2023' },
      { x: 8, y: 0.25, date: 'Mar 10, 2023' },
      { x: 9, y: 0.5, date: 'Mar 10, 2023' },
      { x: 10, y: 0.6, date: 'Mar 10, 2023' },
      { x: 11, y: 0.7, date: 'Mar 10, 2023' },
      { x: 12, y: 0.8, date: 'Mar 10, 2023' },
      { x: 13, y: 1, date: 'Mar 10, 2023' },
      { x: 14, y: 1.2, date: 'Mar 10, 2023' },
      { x: 15, y: 0.7, date: 'Mar 10, 2023' },
      { x: 16, y: 0.5, date: 'Mar 10, 2023' },
      { x: 17, y: 1.25, date: 'Mar 10, 2023' },
    ],
  },
  {
    id: 'line2',
    data: [
      { x: 1, y: 0.35, date: 'Mar 10, 2023' },
      { x: 2, y: 0.85, date: 'Mar 10, 2023' },
      { x: 3, y: 0.4, date: 'Mar 10, 2023' },
      { x: 4, y: 0.35, date: 'Mar 10, 2023' },
      { x: 5, y: 0.2, date: 'Mar 10, 2023' },
      { x: 6, y: 0.7, date: 'Mar 10, 2023' },
      { x: 7, y: 0.7, date: 'Mar 10, 2023' },
      { x: 8, y: 0.4, date: 'Mar 10, 2023' },
      { x: 9, y: 0.8, date: 'Mar 10, 2023' },
      { x: 10, y: 0.9, date: 'Mar 10, 2023' },
      { x: 11, y: 1, date: 'Mar 10, 2023' },
      { x: 12, y: 1.1, date: 'Mar 10, 2023' },
      { x: 13, y: 1, date: 'Mar 10, 2023' },
      { x: 14, y: 1.3, date: 'Mar 10, 2023' },
      { x: 15, y: 0.9, date: 'Mar 10, 2023' },
      { x: 16, y: 1, date: 'Mar 10, 2023' },
      { x: 17, y: 1.7, date: 'Mar 10, 2023' },
    ],
  },
];

function APYChart() {
  const { palette } = useTheme();

  const config: LineSvgProps = {
    data: testData,
    layers: ['markers', 'areas', 'crosshair', 'lines', 'axes', 'mesh'],
    defs: [
      linearGradientDef('gradientA', [
        { offset: 0, color: '#4556DC', opacity: 1 },
        { offset: 70, color: 'white', opacity: 0.3 },
        { offset: 100, color: 'white', opacity: 0 },
      ]),
    ],
    fill: [{ match: '*', id: 'gradientA' }],
    tooltip: APYChartTooltip,
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
    <Box width={720} height={400}>
      <ResponsiveLine {...config} />
    </Box>
  );
}

export default APYChart;
