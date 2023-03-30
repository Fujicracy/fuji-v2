import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { usePositions } from '../../store/positions.store';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import Lending from '../Shared/Lending/Lending';
import MyPositionsBorrowTable from './MyPositionsBorrowTable';
import MyPositionsSummary from './MyPositionsSummary';

function MyPositions() {
  const [currentTab, setCurrentTab] = useState(0);

  const positions = usePositions((state) => state.positions);
  const loading = usePositions((state) => state.loading);

  const isLoading = loading && positions.length === 0;

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
      <BorrowLendingTabNavigation onChange={(tab) => setCurrentTab(tab)} />

      {currentTab === 0 ? (
        <MyPositionsBorrowTable loading={isLoading} />
      ) : (
        <Box sx={{ height: '31rem', width: '100%' }}>
          <Lending />
        </Box>
      )}
    </>
  );
}

export default MyPositions;
