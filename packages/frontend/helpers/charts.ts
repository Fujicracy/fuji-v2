import { AprResult } from '@x-fuji/sdk';

import { MILLISECONDS_IN_DAY } from '../constants';
import { DateFormat, formattedDate } from './values';

export enum Period {
  DAY = 1,
  WEEK = 7,
  MONTH = 30,
  YEAR = 365,
}

export enum ChartTab {
  BORROW = 0,
  DEPOSIT = 1,
}

export const normalizeChartData = (
  source: AprResult[],
  type: ChartTab,
  period: Period
) => {
  const now = new Date();
  const data = source.map((d) => ({
    id: d.name,
    data: d.aprStats
      .filter((s) => {
        if (s.aprBase === null || s.aprReward === null) {
          return false;
        }

        const dataPointDate = new Date(s.timestamp);
        const diffInDays = Math.ceil(
          (now.getTime() - dataPointDate.getTime()) / MILLISECONDS_IN_DAY
        );

        return diffInDays < period;
      })
      .map((s) => ({
        date: formattedDate(DateFormat.YEAR, s.timestamp),
        x: formattedDate(DateFormat.MONTH, s.timestamp),
        y:
          type === ChartTab.BORROW
            ? s.aprBase - s.aprReward
            : s.aprBase + s.aprReward,
        ...s,
      })),
  }));
  return data;
};
