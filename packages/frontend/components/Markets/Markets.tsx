import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { useState } from 'react';

import { chains } from '../../helpers/chains';
import { theme } from '../../styles/theme';
import OnPageBanner from '../Shared/Banners/OnPageBanner';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import Lending from '../Shared/Lending';
import { MarketFilters } from './MarketFiltersHeader';
import MarketFiltersHeader from './MarketFiltersHeader';
import MarketsTable from './MarketsTable';

function Markets() {
  const onMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState<MarketFilters>({
    searchQuery: '',
    chains: chains.map((c) => c.name),
  });

  return (
    <Box>
      <OnPageBanner
        key="referral"
        type="Time Sensitive"
        title="Refer to earn points"
        text="Invite your friends to earn points and hike up the Fuji Mountain together. 🥾"
      />
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
        <BorrowLendingTabNavigation onChange={(tab) => setCurrentTab(tab)} />
      </Grid>

      {currentTab === 0 ? (
        <Box>
          <MarketFiltersHeader filters={filters} setFilters={setFilters} />
          <MarketsTable filters={filters} />
        </Box>
      ) : (
        <Box sx={{ height: '33rem', width: '100%' }}>
          <Lending />
        </Box>
      )}
    </Box>
  );
}

export default Markets;
