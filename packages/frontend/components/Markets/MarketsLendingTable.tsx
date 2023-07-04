import {
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { AbstractVault, VaultType, VaultWithFinancials } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { chains } from '../../helpers/chains';
import { filterMarketRows } from '../../helpers/markets';
import { showPosition } from '../../helpers/navigation';
import { useAuth } from '../../store/auth.store';
import { useMarkets } from '../../store/markets.store';
import { MarketRow } from '../../store/types/markets';
import EmptyRowsState from '../Shared/Table/EmptyRowsState';
import SizableTableCell from '../Shared/Table/SizableTableCell';
import { DocsTooltip } from '../Shared/Tooltips';
import InfoTooltip from '../Shared/Tooltips/InfoTooltip';
import { MarketFilters } from './MarketFiltersHeader';
import MarketsLendingTableRow from './MarketsLendingTableRow';

function MarketsLendingTable({ filters }: { filters: MarketFilters }) {
  const [filteredRows, setFilteredRows] = useState<MarketRow[]>([]);
  const router = useRouter();

  const isLoading = useMarkets((state) => state.loading);
  const vaults = useMarkets((state) => state.lending.vaults);
  const rows = useMarkets((state) => state.lending.rows);

  const walletChainId = useAuth((state) => state.chainId);

  // Filters original rows depends on search or chain
  useEffect(() => {
    setFilteredRows(filterMarketRows(rows.slice(), filters));
  }, [filters, rows]);

  const handleClick = async (entity?: AbstractVault | VaultWithFinancials) => {
    if (!walletChainId) return;
    showPosition(VaultType.LEND, router, false, entity);
  };

  return (
    <TableContainer sx={{ mt: '0.75rem' }}>
      <Table aria-label="Markets table" sx={{ borderCollapse: 'initial' }}>
        <TableHead>
          <TableRow sx={{ height: '2.625rem' }}>
            <SizableTableCell align="left" width="120px">
              Asset
            </SizableTableCell>
            <SizableTableCell width="200px" align="left" sx={{ pl: '48px' }}>
              Network
            </SizableTableCell>
            <SizableTableCell width="130px" align="right">
              Lend APY
            </SizableTableCell>
            <SizableTableCell align="right" width="130px">
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.0rem"
                justifyContent="right"
              >
                <InfoTooltip
                  title={
                    'In the background, Fuji rebalances between these protocols to provide the best terms.'
                  }
                  isLeft
                />
                <span>Protocols</span>
              </Stack>
            </SizableTableCell>
            <SizableTableCell width="140px">
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.25rem"
                justifyContent="right"
              >
                <DocsTooltip />
                <span>Safety Rating</span>
              </Stack>
            </SizableTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && vaults.length === 0 ? (
            <TableRow>
              {new Array(5).fill('').map((_, index) => (
                <TableCell
                  key={`loading${index}`}
                  sx={{
                    height: '3.438rem',
                  }}
                >
                  <Skeleton />
                </TableCell>
              ))}
            </TableRow>
          ) : filteredRows.length > 0 ? (
            filteredRows.map((row, i) => {
              return (
                <MarketsLendingTableRow
                  key={i}
                  row={row}
                  onClick={handleClick}
                  openedByDefault={Boolean(i === 0 && row.children)}
                />
              );
            })
          ) : (
            <EmptyRowsState
              withFilters={Boolean(
                filters.searchQuery || filters.chains.length !== chains.length
              )}
            />
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MarketsLendingTable;
