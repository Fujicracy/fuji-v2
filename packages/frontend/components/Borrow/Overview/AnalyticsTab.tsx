import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AprResult, BorrowingVault } from '@x-fuji/sdk';
import React, { useEffect, useRef, useState } from 'react';

import { TabOption } from '../../../constants';
import { ChartTab, Period } from '../../../helpers/charts';
import { DateFormat, formattedDate } from '../../../helpers/values';
import { useBorrow } from '../../../store/borrow.store';
import APYChart from '../../Shared/Charts/APYChart';
import EmptyChartState from '../../Shared/Charts/EmptyState';
import PeriodOptions from '../../Shared/Filters/PeriodOptions';
import { ProviderIcon } from '../../Shared/Icons';
import TabSwitch from '../../Shared/TabSwitch';
import InfoBlock from '../Analytics/InfoBlock';
import PoolInfo from '../Analytics/PoolInfo';

const chartOptions: TabOption[] = [
  { value: ChartTab.BORROW, label: 'Borrow APR' },
  { value: ChartTab.DEPOSIT, label: 'Deposit APY' },
];

type AprData = AprResult[] | undefined;

function AnalyticsTab() {
  const { palette } = useTheme();
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);
  const vault = useBorrow((state) => state.activeVault);

  const [selectedTab, setSelectedTab] = useState(chartOptions[0].value);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(Period.WEEK);
  const [borrowData, setBorrowData] = useState<AprData>(undefined);
  const [depositData, setDepositData] = useState<AprData>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const prevVault = useRef<BorrowingVault | undefined>(undefined);

  const currentData =
    selectedTab === ChartTab.BORROW ? borrowData : depositData;

  const showInfo = false;

  const onPeriodChange = (period: Period) => {
    setLoading(true);
    setSelectedPeriod(period);

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (vault && vault.address !== prevVault.current?.address) {
      (async () => {
        if (borrowData === undefined || depositData === undefined) {
          setLoading(true);
        }
        prevVault.current = vault;

        const borrowResult = await vault.getProvidersStatsFor(
          debt.currency.wrapped
        );
        setBorrowData(borrowResult.success ? borrowResult.data : undefined);

        const depositResult = await vault.getProvidersStatsFor(
          collateral.currency.wrapped
        );
        setDepositData(depositResult.success ? depositResult.data : undefined);

        setLoading(false);
      })();
    }
  }, [borrowData, depositData, collateral, debt, vault]);

  const loadingSkeleton = (
    <>
      <Skeleton
        sx={{
          width: '100%',
          height: '38rem',
          m: '-8rem 0 -6rem 0',
        }}
      />
    </>
  );

  return currentData ? (
    <Card
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        p: '1.5rem 2rem',
        width: '100%',
        overflow: 'visible',
        mt: '2rem',
      }}
    >
      <CardContent sx={{ width: '100%', padding: 0, gap: '1rem' }}>
        {/*<AnalyticsHeader*/}
        {/*  collateral={collateral}*/}
        {/*  debt={debt}*/}
        {/*  loading={loading}*/}
        {/*/>*/}
        <Typography variant="body2">Analytics</Typography>

        <Stack flexDirection="row" justifyContent="space-between">
          <TabSwitch
            options={chartOptions}
            selected={selectedTab}
            onChange={setSelectedTab}
            width="13.6rem"
          />
          <PeriodOptions onChange={onPeriodChange} isDayExcluded={true} />
        </Stack>

        <Typography variant="smallDark" fontSize="0.875rem" lineHeight="1.4rem">
          {formattedDate(DateFormat.YEAR)}
        </Typography>

        {loading ? (
          loadingSkeleton
        ) : currentData ? (
          <>
            <APYChart
              data={currentData}
              tab={selectedTab}
              period={selectedPeriod}
            />
          </>
        ) : (
          <EmptyChartState />
        )}

        {showInfo && currentData && (
          <>
            <Grid container spacing={2} mt="2rem">
              <Grid item xs={12} sm={6} lg={3}>
                <InfoBlock
                  tooltip="test"
                  label="Active Provider"
                  loading={loading}
                  value={
                    <Stack
                      flexDirection="row"
                      alignItems="center"
                      gap="0.25rem"
                    >
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
                  value={
                    <Typography color={palette.warning.main}>2.55%</Typography>
                  }
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
        )}
      </CardContent>
    </Card>
  ) : null;
}

export default AnalyticsTab;
