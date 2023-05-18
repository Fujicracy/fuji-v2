import {
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { Address, BorrowingVault, VaultWithFinancials } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { NOTIFICATION_MESSAGES } from '../../constants';
import { getAllBorrowingVaultFinancials } from '../../helpers/borrow';
import { chains } from '../../helpers/chains';
import {
  filterMarketRows,
  MarketRow,
  setBase,
  setBest,
  setFinancials,
  setLlamas,
  Status,
} from '../../helpers/markets';
import { showPosition } from '../../helpers/navigation';
import { notify } from '../../helpers/notifications';
import { sdk } from '../../services/sdk';
import { useAuth } from '../../store/auth.store';
import SizableTableCell from '../Shared/SizableTableCell';
import { DocsTooltip } from '../Shared/Tooltips';
import InfoTooltip from '../Shared/Tooltips/InfoTooltip';
import { MarketFilters } from './MarketFiltersHeader';
import MarketsBorrowTableRow from './MarketsBorrowTableRow';

function MarketsBorrowTable({ filters }: { filters: MarketFilters }) {
  const { palette } = useTheme();
  const address = useAuth((state) => state.address);
  // const [appSorting] = useState<SortBy>("descending")
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<MarketRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const walletChain = useAuth((state) => state.chain);

  useEffect(() => {
    const addr = address ? Address.from(address) : undefined;

    const vaults = sdk.getAllBorrowingVaults();
    const rowsBase = vaults.map(setBase);
    setRows(rowsBase);

    (async () => {
      const result = await getAllBorrowingVaultFinancials(addr);

      if (result.errors.length > 0) {
        notify({
          type: 'error',
          message: NOTIFICATION_MESSAGES.MARKETS_FAILURE,
        });
      }

      if (result.data.length === 0) {
        const rows = rowsBase
          .map((r) => setFinancials(r, Status.Error))
          .map((r) => setLlamas(r, Status.Error));
        setRows(setBest(rows));
        return;
      }

      const financials = result.data;
      const rowsFin = financials.map((fin, i) =>
        setFinancials(rowsBase[i], Status.Ready, fin)
      );
      setRows(setBest(rowsFin));

      const llamaResult = await sdk.getLlamaFinancials(financials);
      if (!llamaResult.success) {
        notify({
          type: 'error',
          message: llamaResult.error.message,
        });
        const rows = rowsFin.map((r) => setLlamas(r, Status.Error));
        setRows(setBest(rows));
        return;
      }

      const rowsLlama = llamaResult.data.map((llama, i) =>
        setLlamas(rowsFin[i], Status.Ready, llama)
      );
      setRows(setBest(rowsLlama));
    })().finally(() => {
      setIsLoading(false);
    });
  }, [address]);

  // Filters original rows depends on search or chain
  useEffect(() => {
    setFilteredRows(filterMarketRows(rows.slice(), filters));
  }, [filters, rows]);

  const handleClick = async (entity?: BorrowingVault | VaultWithFinancials) => {
    showPosition(router, walletChain?.id as string, entity);
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
                <span>Borrow APR</span>
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
              Collateral APY
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
            <SizableTableCell width="140px" align="right">
              Liquidity
            </SizableTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
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

function EmptyRowsState({ withFilters }: { withFilters: boolean }) {
  const message = withFilters
    ? 'No results found'
    : 'No data available at the moment';

  return (
    <TableRow>
      <TableCell
        sx={{
          height: '10rem',
        }}
        colSpan={8}
      >
        <Stack
          data-cy="market-empty-state"
          alignItems="center"
          justifyContent="center"
          sx={{
            width: '100%',
          }}
        >
          <Typography variant="body" fontWeight={500}>
            No data
          </Typography>
          <Typography mt="0.25rem" variant="smallDark">
            {message}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default MarketsBorrowTable;
