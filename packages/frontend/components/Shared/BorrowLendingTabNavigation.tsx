import { Chip, Stack, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';

function BorrowLendingTabNavigation({
  onChange,
  isLendingDisabled,
}: {
  onChange: (value: number) => void;
  isLendingDisabled?: boolean;
}) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    onChange(newValue);
  };

  return (
    <Tabs
      value={currentTab}
      onChange={handleTabChange}
      variant={isMobile ? 'fullWidth' : 'standard'}
    >
      <Tab label="Borrowing" />
      <Tab
        disabled={isLendingDisabled}
        label={
          <Stack direction="row" alignItems="center" gap={1}>
            Lending
            {!isMobile && (
              <Chip
                variant="gradient"
                label="Coming soon"
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Stack>
        }
      />
    </Tabs>
  );
}

export default BorrowLendingTabNavigation;
