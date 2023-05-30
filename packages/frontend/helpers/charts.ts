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

  return source.map((d) => ({
    id: d.name,
    data: d.aprStats
      .filter((s) => {
        const dataPointDate = new Date(s.timestamp);
        const diffInDays = Math.ceil(
          (now.getTime() - dataPointDate.getTime()) / MILLISECONDS_IN_DAY
        );

        if (s.aprBase === null) {
          return false;
        }

        return diffInDays <= period;
      })
      .map((s) => {
        const aprReward = s.aprReward ?? 0;

        return {
          date: formattedDate(DateFormat.YEAR, s.timestamp),
          x: formattedDate(DateFormat.MONTH, s.timestamp),
          y:
            type === ChartTab.BORROW
              ? (s.aprBase - aprReward) / 100
              : (s.aprBase + aprReward) / 100,
          ...s,
        };
      }),
  }));
};
