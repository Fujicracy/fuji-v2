import { Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { ProviderIcon } from '../../Shared/Icons';
import TabSwitch from '../../Shared/TabSwitch';
import APYChart from '../Analytics/APYChart';
import InfoBlock from '../Analytics/InfoBlock';

enum ChartTab {
  BORROW = 0,
  DEPOSIT = 1,
}

const chartTabs = [
  { value: ChartTab.BORROW, label: 'Borrow APR' },
  { value: ChartTab.DEPOSIT, label: 'Deposits' },
];

const chartPeriods = [
  { value: 1, label: '1D' },
  { value: 7, label: '1W' },
  { value: 30, label: '1M' },
  { value: 365, label: '1Y' },
];

function AnalyticsTab() {
  const { palette } = useTheme();
  const [selectedTab, setSelectedTab] = useState(ChartTab.BORROW);
  const [selectedPeriod, setSelectedPeriod] = useState(chartPeriods[0].value);

  return (
    <>
      <Stack flexDirection="row" justifyContent="space-between">
        <TabSwitch
          actions={chartTabs}
          selected={selectedTab}
          onChange={setSelectedTab}
          width="13.6rem"
        />
        <TabSwitch
          actions={chartPeriods}
          selected={selectedPeriod}
          onChange={setSelectedPeriod}
          width="14rem"
        />
      </Stack>

      <Typography
        variant="body2"
        fontSize="1.125rem"
        fontWeight={700}
        lineHeight="1.8rem"
      >
        {'2.07%'}
      </Typography>
      <Typography variant="smallDark" fontSize="0.875rem" lineHeight="1.4rem">
        {'Mar 15, 2023'}
      </Typography>

      <APYChart />

      <Grid container spacing={2} mt="2rem">
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock
            tooltip="test"
            label="Active Provider"
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
            tooltip="test"
            label="Borrow APR"
            value={<Typography color={palette.warning.main}>2.55%</Typography>}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock label="Total Borrow Amount" value={'$820.1K'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <InfoBlock label="Available Liquidity" value={'$250.0K'} />
        </Grid>
      </Grid>
    </>
  );
}

export default AnalyticsTab;
