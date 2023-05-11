import { Box, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { useBorrow } from '../../../store/borrow.store';
import APYChart from '../../Shared/Charts/APYChart';
import EmptyChartState from '../../Shared/Charts/EmptyState';
import PeriodOptions from '../../Shared/Filters/PeriodOptions';
import { ProviderIcon } from '../../Shared/Icons';
import TabSwitch from '../../Shared/TabSwitch';
import AnalyticsHeader from '../Analytics/AnalyticsHeader';
import InfoBlock from '../Analytics/InfoBlock';
import PoolInfo from '../Analytics/PoolInfo';

enum ChartTab {
  BORROW = 0,
  DEPOSIT = 1,
}

const chartTabs = [
  { value: ChartTab.BORROW, label: 'Borrow APR' },
  { value: ChartTab.DEPOSIT, label: 'Deposits' },
];

function AnalyticsTab() {
  const { palette } = useTheme();
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);

  const [selectedTab, setSelectedTab] = useState(ChartTab.BORROW);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <>
      <AnalyticsHeader collateral={collateral} debt={debt} loading={loading} />

      <Stack flexDirection="row" justifyContent="space-between">
        <TabSwitch
          actions={chartTabs}
          selected={selectedTab}
          onChange={setSelectedTab}
          width="13.6rem"
        />
        <PeriodOptions onChange={setSelectedPeriod} isDayExcluded={true} />
      </Stack>

      {loading ? (
        <>
          <Skeleton
            sx={{
              width: '3.5rem',
              height: '3rem',
              m: '-1rem 0',
            }}
          />
          <Skeleton
            sx={{
              width: '5.5rem',
              height: '3rem',
              m: '-1rem 0',
            }}
          />

          <Skeleton
            sx={{
              width: '100%',
              height: '38rem',
              m: '-8rem 0 -6rem 0',
            }}
          />
        </>
      ) : !data ? (
        <>
          <Typography
            variant="body2"
            fontSize="1.125rem"
            fontWeight={700}
            lineHeight="1.8rem"
          >
            {'2.07%'}
          </Typography>
          <Typography
            variant="smallDark"
            fontSize="0.875rem"
            lineHeight="1.4rem"
          >
            {'Mar 15, 2023'}
          </Typography>

          <APYChart />
        </>
      ) : (
        <EmptyChartState />
      )}

      <Grid container spacing={2} mt="2rem">
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock
            tooltip="test"
            label="Active Provider"
            loading={loading}
            value={
              <Stack flexDirection="row" alignItems="center" gap="0.25rem">
                <ProviderIcon provider={'test'} height={24} width={24} />
                Aave
              </Stack>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock
            loading={loading}
            tooltip="test"
            label="Borrow APR"
            value={<Typography color={palette.warning.main}>2.55%</Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock
            label="Total Borrow Amount"
            value={'$820.1K'}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock
            label="Available Liquidity"
            value={'$250.0K'}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: '2.5rem' }}>
        <PoolInfo />
      </Box>
    </>
  );
}

export default AnalyticsTab;
