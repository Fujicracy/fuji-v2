import {
  Box,
  Chip,
  Stack,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

function BorrowLendingTabNavigation({
  onChange,
}: {
  onChange: (value: number) => void;
}) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    onChange(newValue);
  };

  return (
    <Box mt={2} mb={3}>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant={isMobile ? 'fullWidth' : 'standard'}
      >
        <Tab label="Borrowing" />
        <Tab
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
    </Box>
  );
}

export default BorrowLendingTabNavigation;
