import { Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';

function BorrowLendingTabNavigation({
  onChange,
  defaultTab,
}: {
  onChange: (value: number) => void;
  defaultTab?: number;
}) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(defaultTab);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    onChange(newValue);
  };

  const tabs = ['Borrowing', 'Lending'];

  return (
    <Tabs
      value={currentTab}
      onChange={handleTabChange}
      variant={isMobile ? 'fullWidth' : 'standard'}
    >
      {tabs.map((tab) => (
        <Tab label={tab} key={tab} />
      ))}
    </Tabs>
  );
}

export default BorrowLendingTabNavigation;
