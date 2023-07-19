import { Grid } from '@mui/material';
import { useState } from 'react';

import TabSwitch from './TabSwitch/TabSwitch';

function BorrowLendingTabNavigation({
  onChange,
  defaultTab,
}: {
  onChange: (value: number) => void;
  defaultTab?: number;
}) {
  const [currentTab, setCurrentTab] = useState(defaultTab || 0);
  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
    onChange(newValue);
  };

  const tabs = [
    { label: 'Borrowing', value: 0 },
    { label: 'Lending', value: 1 },
  ];

  return (
    <Grid>
      <TabSwitch
        options={tabs}
        selected={currentTab}
        onChange={handleTabChange}
        size="large"
        width="300px"
        withBackground
      />
    </Grid>
  );
}

export default BorrowLendingTabNavigation;
