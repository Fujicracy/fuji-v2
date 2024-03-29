import { Grid, Typography } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);

  const borrowPositions = usePositions((state) => state.borrowPositions);
  const lendingPositions = usePositions((state) => state.lendingPositions);
  const borrowMarkets = useMarkets((state) => state.borrow.rows);
  const lendMarkets = useMarkets((state) => state.lending.rows);

  useEffect(() => {
    setTimeout(() => {
      setIsTransitionActive(false);
    }, 500);
  }, [currentTab]);

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
          onChange={(tab) => {
            setIsTransitionActive(true);
            setCurrentTab(tab);
          }}
          defaultTab={currentTab}
        />
      </Grid>

      <MyPositionsTable
        positions={currentTab === 0 ? borrowPositions : lendingPositions}
        type={currentTab === 0 ? VaultType.BORROW : VaultType.LEND}
        markets={currentTab === 0 ? borrowMarkets : lendMarkets}
        isTransitionActive={isTransitionActive}
      />
    </>
  );
}

export default MyPositions;
