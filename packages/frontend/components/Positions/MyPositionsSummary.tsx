import {
  Box,
  Button,
  Card,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { showBorrow } from '../../helpers/navigation';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { usePositions } from '../../store/positions.store';
import InfoTooltip from '../Shared/Tooltips/InfoTooltip';
import PositionYieldsModal from './PositionYieldsModal';

type MetricSummary = {
  name: string;
  value: number | '-';
  valueSym?: '$' | '%';
  action?: string;
  tooltip?: boolean;
};

const initialKeyMetrics: MetricSummary[] = [
  { name: 'Total Deposits Value', value: '-', valueSym: '$' },
  { name: 'Total Debt Value', value: '-', valueSym: '$' },
  { name: 'Net APY', value: '-', valueSym: '%', action: 'Details' },
  {
    name: 'Available to Borrow',
    value: '-',
    valueSym: '$',
    action: 'Borrow',
  },
];

function updateKeyMetricsSummary(
  totalDeposits_: number | undefined,
  totalDebt_: number | undefined,
  totalAPY_: number | undefined,
  availableBorrow_: number | undefined
): MetricSummary[] {
  return [
    {
      name: 'Total Deposits Value',
      value: totalDeposits_ ?? '-',
      valueSym: '$',
    },
    {
      name: 'Total Debt Value',
      value: totalDebt_ ?? '-',
      valueSym: '$',
    },
    {
      name: 'Total Net APY',
      value: totalAPY_ ?? '-',
      valueSym: '%',
      tooltip: true,
      action: 'Details',
    },
    {
      name: 'Available to Borrow',
      value: availableBorrow_ ?? '-',
      valueSym: '$',
      action: 'Borrow',
    },
  ];
}

function MyPositionsSummary() {
  const { breakpoints, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));
  const router = useRouter();

  const account = useAuth((state) => state.address);
  const totalDeposits = usePositions((state) => state.totalDepositsUSD);
  const totalDebt = usePositions((state) => state.totalDebtUSD);
  const totalAPY = usePositions((state) => state.totalAPY);
  const availableBorrow = usePositions(
    (state) => state.availableBorrowPowerUSD
  );

  const [isPositionsYieldsModalShown, setIsPositionsYieldsModalShown] =
    useState<boolean>(false);

  const [keyMetrics, setKeyMetrics] = useState(initialKeyMetrics);

  useEffect(() => {
    if (account === undefined) {
      setKeyMetrics(initialKeyMetrics);
    } else {
      const updatedKeyMetrics = updateKeyMetricsSummary(
        totalDeposits,
        totalDebt,
        totalAPY,
        availableBorrow
      );
      setKeyMetrics(updatedKeyMetrics);
    }
  }, [account, totalDeposits, totalDebt, totalAPY, availableBorrow]);

  const mappedActions: {
    [key: string]: () => void;
  } = {
    ['Borrow']: () => showBorrow(router),
    ['Details']: () => setIsPositionsYieldsModalShown(true),
  };

  const getAction = (actionName?: string): (() => void) | undefined => {
    return actionName ? mappedActions[actionName] : undefined;
  };

  return (
    <Box mt={4}>
      <Card
        variant="outlined"
        sx={{ background: palette.secondary.contrastText }}
      >
        <Grid container>
          {keyMetrics.map((m, i) => (
            <Grid item padding={{ xs: 1, md: 0 }} key={m.name} xs={6} md>
              <Metric
                metric={m}
                borderLeft={!isMobile && i > 0}
                onClick={getAction(m.action)}
              />
            </Grid>
          ))}
        </Grid>
      </Card>
      <PositionYieldsModal
        open={isPositionsYieldsModalShown}
        onClose={() => setIsPositionsYieldsModalShown(false)}
      />
    </Box>
  );
}

export default MyPositionsSummary;

type MetricProps = {
  metric: MetricSummary;
  borderLeft: boolean;
  onClick: (() => void) | undefined;
};

const Metric = ({ metric, borderLeft: leftBorder, onClick }: MetricProps) => {
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const borderColor = palette.secondary.light;
  const nameColor = palette.text.primary;

  return (
    <Box
      borderLeft={leftBorder ? `1px solid ${borderColor}` : ''}
      pl={leftBorder ? 4 : ''}
      sx={{
        ['@media screen and (max-width: 500px)']: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        },
      }}
    >
      <Typography color={nameColor} fontSize="0.875rem">
        {metric.name}{' '}
        {metric.tooltip && (
          <InfoTooltip title="Net APY accounts for all positions, APR earned by collateral minus APR accrued by debt" />
        )}
      </Typography>

      <Stack
        display="flex"
        direction="row"
        alignItems="center"
        flex={1}
        flexWrap="wrap"
        gap={0.5}
        sx={{
          ['@media screen and (max-width: 500px)']: {
            flexDirection: 'column',
            alignItems: 'start',
            justifyContent: 'space-between',
          },
        }}
      >
        <Typography
          fontSize="1.5rem"
          color={metric.name === 'Positions at Risk' ? 'error' : 'inherit'}
        >
          {metric.valueSym === '$'
            ? `${formatValue(metric.value, {
                style: 'currency',
                maximumFractionDigits: 0,
              })}`
            : metric.valueSym === '%'
            ? `${metric.value}%`
            : metric.value}{' '}
          {isMobile && <br />}
        </Typography>
        {metric.action && metric.value !== 0 && (
          <Button
            variant="secondary2"
            sx={{
              marginLeft: isMobile ? '0rem' : '0.5rem',
              marginTop: isMobile ? '0.5rem' : '0rem',
              padding: '6px 16px 5px',
              lineHeight: '0.875rem',
              fontSize: '0.875rem',
              backgroundColor: palette.secondary.main,
              border: 'none',
              color: palette.text.primary,
            }}
            disabled={metric.value === '-'}
            onClick={onClick}
          >
            {metric.action}
          </Button>
        )}
      </Stack>
    </Box>
  );
};
