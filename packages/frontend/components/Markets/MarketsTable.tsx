import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Address, BorrowingVault, VaultWithFinancials } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { NOTIFICATION_MESSAGES } from '../../constants';
import { getAllBorrowingVaultFinancials } from '../../helpers/borrow';
import {
  groupByPair,
  MarketRow,
  setBase,
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
import MarketsTableRow from './MarketsTableRow';

function MarketsTable() {
  const { palette } = useTheme();
  const address = useAuth((state) => state.address);
  // const [appSorting] = useState<SortBy>("descending")
  const [rows, setRows] = useState<MarketRow[]>([]);
  const router = useRouter();

  const walletChain = useAuth((state) => state.chain);

  useEffect(() => {
    const addr = address ? Address.from(address) : undefined;

    const vaults = sdk.getAllBorrowingVaults();
    const rowsBase = vaults.map(setBase);
    setRows(groupByPair(rowsBase));

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
        setRows(groupByPair(rows));
        return;
      }

      const financials = result.data;
      const rowsFin = financials.map((fin, i) =>
        setFinancials(rowsBase[i], Status.Ready, fin)
      );
      setRows(groupByPair(rowsFin));

      const llamaResult = await sdk.getLlamaFinancials(financials);
      if (!llamaResult.success) {
        notify({
          type: 'error',
          message: llamaResult.error.message,
        });
        const rows = rowsFin.map((r) => setLlamas(r, Status.Error));
        setRows(groupByPair(rows));
        return;
      }

      const rowsLlama = llamaResult.data.map((llama, i) =>
        setLlamas(rowsFin[i], Status.Ready, llama)
      );
      setRows(groupByPair(rowsLlama));
    })();
  }, [address]);

  const handleClick = async (entity?: BorrowingVault | VaultWithFinancials) => {
    showPosition(router, walletChain?.id as string, entity);
  };

  return (
    <TableContainer>
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
              Collateral APR
            </SizableTableCell>
            <SizableTableCell align="right" width="130px">
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.25rem"
                justifyContent="right"
              >
                <Tooltip
                  arrow
                  title="In the background, Fuji rebalances between these protocols to provide the best terms."
                  placement="top"
                >
                  <InfoOutlinedIcon
                    sx={{ fontSize: '0.875rem', color: palette.info.main }}
                  />
                </Tooltip>
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
          {rows.map((row, i) => (
            <MarketsTableRow
              key={i}
              row={row}
              onClick={handleClick}
              isBest={i === 0}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default MarketsTable;
