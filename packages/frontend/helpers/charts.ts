import { AprResult, AprStat } from '@x-fuji/sdk';

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

type AprStatChart = AprStat & {
  x: string;
  y: number;
  [key: string]: any;
};

type AprResultChart = {
  id: string;
  data: AprStatChart[];
};

export const normalizeChartData = (
  source: AprResult[],
  type: ChartTab,
  period: Period
): AprResultChart[] => {
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
          x: formattedDate(DateFormat.YEAR, s.timestamp),
          y:
            type === ChartTab.BORROW
              ? s.aprBase - aprReward
              : s.aprBase + aprReward,
          ...s,
        };
      }),
  }));
};

export const xAxisValues = (
  data: AprResultChart[],
  period: Period
): string[] => {
  if (!data.length) return [];

  const longest = data.reduce((longest, current) => {
    return current.data.length > longest.data.length ? current : longest;
  });

  const valuesToShow = longest.data
    .map((v, i) =>
      i %
        (period === Period.WEEK
          ? Period.DAY
          : period === Period.MONTH
          ? Period.WEEK
          : Period.MONTH) ===
      0
        ? v.x
        : undefined
    )
    .filter((v) => v);

  return valuesToShow as string[];
};
