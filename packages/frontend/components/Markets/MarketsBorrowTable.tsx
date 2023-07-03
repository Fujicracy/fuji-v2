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
import SizableTableCell from '../Shared/SizableTableCell';
import EmptyRowsState from '../Shared/Table/EmptyRowsState';
import { DocsTooltip, RebalanceTooltip } from '../Shared/Tooltips';
import { MarketFilters } from './MarketFiltersHeader';
import MarketsBorrowTableRow from './MarketsBorrowTableRow';

function MarketsBorrowTable({ filters }: { filters: MarketFilters }) {
  const { palette } = useTheme();

  const [filteredRows, setFilteredRows] = useState<MarketRow[]>([]);
  const router = useRouter();

  const isLoading = useMarkets((state) => state.loading);
  const vaults = useMarkets((state) => state.borrow.vaults);
  const rows = useMarkets((state) => state.borrow.rows);

  const walletChainId = useAuth((state) => state.chainId);

  // Filters original rows depends on search or chain
  useEffect(() => {
    setFilteredRows(filterMarketRows(rows.slice(), filters));
  }, [filters, rows]);

  const handleClick = async (entity?: AbstractVault | VaultWithFinancials) => {
    showPosition(VaultType.BORROW, router, true, entity, walletChainId);
  };

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
              Borrow
            </SizableTableCell>
            <SizableTableCell align="left" width="120px">
              Collateral
            </SizableTableCell>
            <SizableTableCell width="200px" align="left" sx={{ pl: '48px' }}>
              Network
            </SizableTableCell>
            <SizableTableCell width="140px" align="right">
              <Stack
                direction="row"
                spacing="0.25rem"
                alignItems="center"
                justifyContent="right"
                // Disabling app sorting for 1st iteration
                // sx={{ cursor: "pointer" }}
                // onClick={() =>
                //   setAppSorting(
                //     appSorting === "ascending" ? "descending" : "ascending"
                //   )
                // }
              >
                Borrow APR
                {/* {appSorting === "descending" ? (
                  <KeyboardArrowUpIcon
                    sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                  />
                ) : (
                  <KeyboardArrowDownIcon
                    sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                  />
                )} */}
              </Stack>
            </SizableTableCell>
            <SizableTableCell width="130px" align="right">
              Supply APY
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
            <SizableTableCell width="140px" align="right">
              Liquidity
            </SizableTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && vaults.length === 0 ? (
            <TableRow>
              {new Array(8).fill('').map((_, index) => (
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
                <MarketsBorrowTableRow
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

export default MarketsBorrowTable;
