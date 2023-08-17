import { Grid, Typography } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useMarkets } from '../../store/markets.store';
import { usePositions } from '../../store/positions.store';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import MyPositionsSummary from './MyPositionsSummary';
import MyPositionsTable from './MyPositionsTable';

function MyPositions() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(
    router.query?.tab === 'lend' ? 1 : 0
  );

  const borrowPositions = usePositions((state) => state.borrowPositions);
  const lendingPositions = usePositions((state) => state.lendingPositions);
  const borrowMarkets = useMarkets((state) => state.borrow.rows);
  const lendMarkets = useMarkets((state) => state.lending.rows);

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
        <BorrowLendingTabNavigation
          onChange={(tab) => setCurrentTab(tab)}
          defaultTab={currentTab}
        />
      </Grid>

      {currentTab === 0 ? (
        <MyPositionsTable
          positions={borrowPositions}
          type={VaultType.BORROW}
          markets={borrowMarkets}
        />
      ) : (
        <MyPositionsTable
          positions={lendingPositions}
          type={VaultType.LEND}
          markets={lendMarkets}
        />
      )}
    </>
  );
}

export default MyPositions;
