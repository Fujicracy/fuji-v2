import {
  Box,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import { usePositions } from '../../store/positions.store';
import Lending from '../Shared/Lending/Lending';
import MyPositionsBorrowTable from './MyPositionsBorrowTable';
import MyPositionsSummary from './MyPositionsSummary';

function MyPositions() {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const [currentTab, setCurrentTab] = useState(0);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue);

  const loading = usePositions((state) => state.loading);

  return (
    <>
      <Typography variant="h4" mb={1}>
        My Positions
      </Typography>
      <Typography variant="body">
        Fuji manages your borrowing and lending positions for maximum capital
        efficiency
      </Typography>
      <MyPositionsSummary />
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

      {currentTab === 0 ? (
        <MyPositionsBorrowTable loading={loading} />
      ) : (
        <Box sx={{ height: '31rem', width: '100%' }}>
          <Lending />
        </Box>
      )}
    </>
  );
}

export default MyPositions;
