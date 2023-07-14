import { Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { AprResult, BorrowingVault, VaultType } from '@x-fuji/sdk';
import React, { useEffect, useRef, useState } from 'react';

import { TabOption } from '../../../../constants';
import { ChartTab, Period } from '../../../../helpers/charts';
import { useBorrow } from '../../../../store/borrow.store';
import APYChart from '../../../Shared/Charts/APYChart';
import ChartAPYHeader from '../../../Shared/Charts/ChartAPYHeader';
import EmptyChartState from '../../../Shared/Charts/EmptyState';
import PeriodOptions from '../../../Shared/Filters/PeriodOptions';
import TabSwitch from '../../../Shared/TabSwitch/TabSwitch';

const chartOptions: TabOption[] = [
  { value: ChartTab.BORROW, label: 'Borrow APR' },
  { value: ChartTab.DEPOSIT, label: 'Supply APY' },
];

type AprData = AprResult[] | undefined;

function Analytics() {
  const vault = useBorrow((state) => state.activeVault);
  const activeProvider = useBorrow((state) => state.activeProvider);

  const [selectedTab, setSelectedTab] = useState(chartOptions[0].value);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(Period.WEEK);
  const [borrowData, setBorrowData] = useState<AprData>(undefined);
  const [depositData, setDepositData] = useState<AprData>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const prevVault = useRef<BorrowingVault | undefined>(undefined);

  const currentData =
    selectedTab === ChartTab.BORROW ? borrowData : depositData;

  const onPeriodChange = (period: Period) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    if (vault && vault.address !== prevVault.current?.address) {
      (async () => {
        prevVault.current = vault;

        setLoading(true);

        const borrowResult = await vault.getBorrowProviderStats();
        const depositResult = await vault.getSupplyProviderStats();
        setBorrowData(borrowResult.success ? borrowResult.data : undefined);
        setDepositData(depositResult.success ? depositResult.data : undefined);

        setLoading(false);
      })();
    }
  }, [borrowData, depositData, vault]);

  const loadingSkeleton = (
    <>
      <Skeleton
        sx={{
          width: '100%',
          height: '38rem',
          m: '-7rem 0 -6rem 0',
        }}
      />
    </>
  );

  return (
    <Card
      sx={{
        flexDirection: 'column',
        alignItems: 'center',
        p: '1.5rem',
        width: '100%',
        overflow: 'visible',
        mt: '2rem',
      }}
    >
      <CardContent sx={{ width: '100%', padding: 0, gap: '1rem' }}>
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

        <ChartAPYHeader
          activeProvider={activeProvider}
          type={
            selectedTab === ChartTab.BORROW ? VaultType.BORROW : VaultType.LEND
          }
        />

        {loading ? (
          loadingSkeleton
        ) : currentData &&
          currentData.length > 0 &&
          currentData.some((data) => data.aprStats.length > 0) ? (
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
      </CardContent>
    </Card>
  );
}

export default Analytics;
