import {
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
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
import { DocsTooltip, RebalanceTooltip } from '../Shared/Tooltips';
import { MarketFilters } from './MarketFiltersHeader';
import MarketsTableRow from './MarketsTableRow';

type MarketsTableProps = {
  rows: MarketRow[];
  filters: MarketFilters;
  vaults: AbstractVault[];
  type: VaultType;
};

function MarketsTable({ filters, rows, vaults, type }: MarketsTableProps) {
  const { palette } = useTheme();
  const router = useRouter();

  const [filteredRows, setFilteredRows] = useState<MarketRow[]>([]);

  const isLoading = useMarkets((state) => state.loading);

  const walletChainId = useAuth((state) => state.chainId);

  // Filters original rows depends on search or chain
  useEffect(() => {
    setFilteredRows(filterMarketRows(rows.slice(), filters, type));
  }, [filters, rows, type]);

  const handleClick = async (entity?: AbstractVault | VaultWithFinancials) => {
    showPosition(type, router, true, entity, walletChainId);
  };

  const numberOfColumns = type === VaultType.BORROW ? 8 : 5;
  const isLend = type === VaultType.LEND;

  return (
    <TableContainer sx={{ mt: '0.75rem' }}>
      <Table
        aria-label="Markets table"
        // border-collapse fix bug on borders on firefox with sticky column
        sx={{ borderCollapse: 'initial' }}
      >
        <TableHead>
          <TableRow sx={{ height: '2.625rem' }}>
            <SizableTableCell
              width="160px"
              sx={{
                position: 'sticky',
                left: 0,
                zIndex: 1,
                background: palette.secondary.contrastText,
                pl: '48px',
              }}
              align="left"
            >
              {isLend ? 'Asset' : 'Borrow'}
            </SizableTableCell>
            {!isLend && (
              <SizableTableCell align="left" width="120px">
                Collateral
              </SizableTableCell>
            )}
            <SizableTableCell width="200px" align="left" sx={{ pl: '48px' }}>
              Network
            </SizableTableCell>
            {!isLend && (
              <SizableTableCell width="140px" align="right">
                <Stack
                  direction="row"
                  spacing="0.25rem"
                  alignItems="center"
                  justifyContent="right"
                >
                  Borrow APR
                </Stack>
              </SizableTableCell>
            )}
            <SizableTableCell width="130px" align="right">
              {'Supply APY'}
            </SizableTableCell>
            <SizableTableCell align="right" width="130px">
              <Stack direction="row" alignItems="center" justifyContent="right">
                <RebalanceTooltip />
                Protocols
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
                Safety Rating
              </Stack>
            </SizableTableCell>
            {!isLend && (
              <SizableTableCell width="140px" align="right">
                Liquidity
              </SizableTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && vaults.length === 0 ? (
            <TableRow>
              {new Array(numberOfColumns).fill('').map((_, index) => (
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
                <MarketsTableRow
                  key={i}
                  row={row}
                  onClick={handleClick}
                  type={type}
                  numberOfColumns={numberOfColumns}
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

export default MarketsTable;
