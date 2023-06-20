import { Card, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { useBorrow } from '../../store/borrow.store';
import InfoBlock from '../Shared/Analytics/InfoBlock';
import APYChart from '../Shared/Charts/APYChart';
import EmptyChartState from '../Shared/Charts/EmptyState';
import PeriodOptions from '../Shared/Filters/PeriodOptions';
import RiskBlock from './RiskBlock';
import VaultStrategy from './VaultStrategy';

function LendingDetails() {
  const { palette } = useTheme();
  const collateral = useBorrow((state) => state.collateral);

  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <>
      <Card sx={{ display: 'flex', flexDirection: 'column', p: '0 1.5rem' }}>
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

      <Grid container spacing={2} mt={0}>
        <Grid item xs={12} sm={6}>
          <InfoBlock
            loading={loading}
            tooltip="test"
            label="Current APY"
            value={<Typography color={palette.warning.main}>2.55%</Typography>}
            contrast
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <InfoBlock
            label="Total Supplied"
            value={'$820.1K'}
            loading={loading}
            contrast
          />
        </Grid>
      </Grid>

      <VaultStrategy />

      <RiskBlock />
    </>
  );
}

export default LendingDetails;
