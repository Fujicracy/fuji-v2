import { Stack } from '@mui/material';
import React, { useState } from 'react';

import TabSwitch from '../../Shared/TabSwitch';
import APYChart from '../Analytics/APYChart';

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
      <APYChart />
    </>
  );
}

export default AnalyticsTab;
