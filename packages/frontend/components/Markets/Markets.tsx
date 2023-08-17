import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { chains } from '../../helpers/chains';
import { useAuth } from '../../store/auth.store';
import { useMarkets } from '../../store/markets.store';
import { theme } from '../../styles/theme';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import MarketFiltersHeader, { MarketFilters } from './MarketFiltersHeader';
import MarketsTable from './MarketsTable';

function Markets() {
  const router = useRouter();
  const onMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const address = useAuth((state) => state.address);
  const fetchMarkets = useMarkets((state) => state.fetchMarkets);
  const borrowVaults = useMarkets((state) => state.borrow.vaults);
  const borrowRows = useMarkets((state) => state.borrow.rows);
  const lendingVaults = useMarkets((state) => state.lending.vaults);
  const lendingRows = useMarkets((state) => state.lending.rows);

  const [currentTab, setCurrentTab] = useState<number>(
    router.query?.tab === 'lend' ? 1 : 0
  );

  const [filters, setFilters] = useState<MarketFilters>({
    searchQuery: '',
    chains: chains.map((c) => c.name),
  });

  useEffect(() => {
    fetchMarkets(address);
  }, [address, fetchMarkets]);

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
          defaultTab={currentTab}
        />
        <MarketFiltersHeader filters={filters} setFilters={setFilters} />
      </Grid>

      {currentTab === 0 ? (
        <MarketsTable
          filters={filters}
          rows={borrowRows}
          vaults={borrowVaults}
          type={VaultType.BORROW}
        />
      ) : (
        <MarketsTable
          filters={filters}
          rows={lendingRows}
          vaults={lendingVaults}
          type={VaultType.LEND}
        />
      )}
    </Box>
  );
}

export default Markets;
