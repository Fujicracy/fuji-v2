import {
  Card,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { useBorrow } from '../../store/borrow.store';
import InfoBlock from '../Shared/Analytics/InfoBlock';
import APYChart from '../Shared/Charts/APYChart';
import EmptyChartState from '../Shared/Charts/EmptyState';
import PeriodOptions from '../Shared/Filters/PeriodOptions';
import { ProviderIcon } from '../Shared/Icons';
import LendingHeader from './LendingHeader';

function LendingDetails() {
  const { palette } = useTheme();
  const collateral = useBorrow((state) => state.collateral);

  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <>
      <Card sx={{ display: 'flex', flexDirection: 'column', p: '1.5rem' }}>
        <LendingHeader collateral={collateral} loading={false} />

        <Divider sx={{ mt: '1rem', mb: '2rem', width: '100%' }} />

        <Grid container spacing={2}>
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
              label="Current APY"
              value={
                <Typography color={palette.warning.main}>2.55%</Typography>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <InfoBlock
              label="Total Supplied"
              value={'$820.1K'}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <InfoBlock label="My Deposits" value={'0'} loading={loading} />
          </Grid>
        </Grid>

        <Stack
          flexDirection="row"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Stack
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
          >
            {loading ? (
              <>
                <Skeleton
                  sx={{
                    width: '3.5rem',
                    height: '3rem',
                    m: '0',
                  }}
                />
                <Skeleton
                  sx={{
                    width: '5.5rem',
                    height: '3rem',
                    m: '-1rem 0',
                  }}
                />
              </>
            ) : (
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
              </>
            )}
          </Stack>

          <PeriodOptions onChange={setSelectedPeriod} isDayExcluded={true} />
        </Stack>

        {loading ? (
          <Skeleton
            sx={{
              width: '100%',
              height: '38rem',
              m: '-8rem 0 -6rem 0',
            }}
          />
        ) : !data ? (
          <APYChart />
        ) : (
          <EmptyChartState />
        )}
      </Card>
    </>
  );
}

export default LendingDetails;
