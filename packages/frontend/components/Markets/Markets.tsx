import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { chains } from '../../helpers/chains';
import { theme } from '../../styles/theme';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import { MarketFilters } from './MarketFiltersHeader';
import MarketFiltersHeader from './MarketFiltersHeader';
import MarketsBorrowTable from './MarketsBorrowTable';
import MarketsLendingTable from './MarketsLendingTable';

function Markets() {
  const onMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<number>(
    parseInt((router.query?.tab as string) || '0')
  );
  const [filters, setFilters] = useState<MarketFilters>({
    searchQuery: '',
    chains: chains.map((c) => c.name),
  });

  return (
    <Box>
      <Typography variant="h4">Markets</Typography>
      <Typography variant="body">
        {currentTab === 0 || onMobile
          ? 'Fuji aggregates the best borrowing rates across different markets'
          : 'Fuji aggregates different markets and provides the best lending rates cross-chain'}
      </Typography>
      <Grid
        container
        mt="2.5rem"
        mb="1rem"
        justifyContent="space-between"
        alignItems="center"
        wrap="wrap"
      >
        <BorrowLendingTabNavigation
          onChange={(tab) => setCurrentTab(tab)}
          defaultTab={parseInt((router.query?.tab as string) || '0')}
        />
      </Grid>

      <Box>
        <MarketFiltersHeader filters={filters} setFilters={setFilters} />
        {currentTab === 0 ? (
          <MarketsBorrowTable filters={filters} />
        ) : (
          <MarketsLendingTable filters={filters} />
        )}
      </Box>
    </Box>
  );
}

export default Markets;
