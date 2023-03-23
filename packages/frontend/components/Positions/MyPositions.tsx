import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { usePositions } from '../../store/positions.store';
import BorrowDepositTabNavigation from '../Shared/BorrowDepositTabNavigation';
import Lending from '../Shared/Lending/Lending';
import MyPositionsBorrowTable from './MyPositionsBorrowTable';
import MyPositionsSummary from './MyPositionsSummary';
import PositionYieldsModal from './PositionYieldsModal';

function MyPositions() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isPositionsYieldsModalShown, setIsPositionsYieldsModalShown] =
    useState<boolean>(true);

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
      <BorrowDepositTabNavigation onChange={(tab) => setCurrentTab(tab)} />

      {currentTab === 0 ? (
        <MyPositionsBorrowTable loading={loading} />
      ) : (
        <Box sx={{ height: '31rem', width: '100%' }}>
          <Lending />
        </Box>
      )}

      <PositionYieldsModal
        open={isPositionsYieldsModalShown}
        onClose={() => setIsPositionsYieldsModalShown(false)}
      />
    </>
  );
}

export default MyPositions;
