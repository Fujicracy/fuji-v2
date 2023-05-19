import { Grid, Typography } from '@mui/material';
import { useState } from 'react';

import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import MyPositionLendingTable from './MyPositionLendingTable';
import MyPositionsBorrowTable from './MyPositionsBorrowTable';
import MyPositionsSummary from './MyPositionsSummary';

function MyPositions() {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <>
      <Typography variant="h4" mb={1}>
        My Positions
      </Typography>
      <Typography variant="body">
        Fuji rebalances your lending and borrowing positions to get you the best
        terms
      </Typography>

      <MyPositionsSummary />

      <Grid container mt="2.5rem" mb="1rem">
        <BorrowLendingTabNavigation onChange={(tab) => setCurrentTab(tab)} />
      </Grid>

      {currentTab === 0 ? (
        <MyPositionsBorrowTable />
      ) : (
        <MyPositionLendingTable />
      )}
    </>
  );
}

export default MyPositions;
