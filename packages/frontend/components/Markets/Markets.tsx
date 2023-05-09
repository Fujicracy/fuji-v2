import { Box, Grid, Typography, useMediaQuery } from '@mui/material';
import { useState } from 'react';

import { theme } from '../../styles/theme';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import Lending from '../Shared/Lending';
import { MarketFilters } from './MarketFilters';
import MarketFiltersHeader from './MarketFilters';
import MarketsTable from './MarketsTable';

function Markets() {
  const onMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState<MarketFilters>({
    searchQuery: '',
    chain: '',
  });
  /* const [filterValue, setFilterValue] = useState("") */
  /* const [chainFilters, setChainFilters] = useState<Chain[]>([]) */

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
        <BorrowLendingTabNavigation onChange={(tab) => setCurrentTab(tab)} />

        {/* {currentTab === 0 && (
          <Stack
            direction="row"
            gap="0.5rem"
            alignItems="center"
            flexWrap="wrap"
            mt="0.75rem"
          >
            <Typography
              variant="smallDark"
              color={palette.info.main}
              mr="0.25rem"
            >
              Filter Chains:
            </Typography>
            {chains.map((chain: Chain) => (
              <Tooltip arrow title={chain.label} placement="top" key={chain.id}>
                <Box
                  sx={{
                    borderRadius: "100%",
                    width: "1.125rem",
                    height: "1.125rem",
                    cursor: "pointer",
                    border: chainFilters.includes(chain)
                      ? `1px solid white`
                      : "",
                  }}
                >
                  <Image
                    src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                    height={18}
                    width={18}
                    objectFit="cover"
                    alt={chain.label}
                    onClick={() => {
                      chainFilters.includes(chain)
                        ? setChainFilters(
                            chainFilters.filter((c) => c !== chain)
                          )
                        : setChainFilters([...chainFilters, chain])
                    }}
                  />
                </Box>
              </Tooltip>
            ))}
            <TextField
              id="filter"
              type="text"
              placeholder="Filter by token, protocol"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              variant="outlined"
              sx={{ ".MuiInputBase-input": { minWidth: "170px" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: palette.info.dark }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )} */}
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
