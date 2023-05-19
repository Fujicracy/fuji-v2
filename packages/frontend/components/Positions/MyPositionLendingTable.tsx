import {
  Chip,
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
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { chainName } from '../../helpers/chains';
import { showPosition } from '../../helpers/navigation';
import {
  getRows,
  PositionRow,
  vaultFromAddress,
} from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { usePositions } from '../../store/positions.store';
import { NetworkIcon, TokenIcon } from '../Shared/Icons';
import ExtraTableSpace from '../Shared/Table/ExtraTableSpace';
import IntegratedProtocols from '../Shared/Table/IntegratedProtocols';
import { DocsTooltip } from '../Shared/Tooltips';
import InfoTooltip from '../Shared/Tooltips/InfoTooltip';
import EmptyState from './EmptyState';

function MyPositionsLendingTable() {
  const { palette } = useTheme();
  const router = useRouter();
  const account = useAuth((state) => state.address);
  const positions = usePositions((state) => state.positions);
  const isLoading = usePositions((state) => state.loading);

  const loading = isLoading && positions.length === 0;
  const [rows, setRows] = useState<PositionRow[]>([]);

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (!account) {
    return (
      <MyPositionsLendingTableContainer>
        <EmptyState reason="no-wallet" />
      </MyPositionsLendingTableContainer>
    );
  }
  if (loading) {
    return (
      <MyPositionsLendingTableContainer>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(5).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </MyPositionsLendingTableContainer>
    );
  }

  function handleClick(row: PositionRow) {
    const entity = vaultFromAddress(row.address);
    showPosition(router, String(entity?.chainId), entity);
  }

  return (
    <MyPositionsLendingTableContainer>
      {rows.length === 0 && positions.length === 0 ? (
        <EmptyState reason="no-positions" />
      ) : (
        <>
          {rows.map((row, i) => (
            <TableRow
              key={i}
              sx={{
                cursor: 'pointer',
                height: '3.375rem',
                '&:hover': {
                  '& .MuiTableCell-root': { background: '#34363E' },
                },
              }}
              onClick={() => handleClick(row)}
            >
              <TableCell>
                <Stack direction="row" alignItems="center" gap="0.5rem">
                  <NetworkIcon
                    network={chainName(row.chainId)}
                    width={24}
                    height={24}
                  />
                  {chainName(row.chainId)}
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" alignItems="center">
                  <TokenIcon
                    token={row.collateral.symbol}
                    width={24}
                    height={24}
                  />
                  <Typography variant="small" fontWeight={500} ml="0.5rem">
                    {formatValue(row.collateral.amount)} {row.collateral.symbol}
                  </Typography>
                  <Typography variant="xsmall" ml="0.25rem">
                    (
                    {formatValue(row.collateral.usdValue, {
                      style: 'currency',
                      maximumFractionDigits: 2,
                    })}
                    )
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Typography variant="small" color={palette.warning.main}>
                  {row.apr}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <IntegratedProtocols integratedProtocols={[]} />
              </TableCell>
              <TableCell align="right">
                <Chip
                  variant={'success'}
                  label={'A+'}
                  sx={{ '& .MuiChip-label': { p: '0.25rem 0.5rem' } }}
                />
              </TableCell>
            </TableRow>
          ))}
          <ExtraTableSpace colSpan={5} itemLength={rows.length} max={5} />
        </>
      )}
    </MyPositionsLendingTableContainer>
  );
}

export default MyPositionsLendingTable;

type PositionsLendingTableElementProps = {
  children: string | JSX.Element | JSX.Element[];
};

function MyPositionsLendingTableHeader() {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell>Network</TableCell>
        <TableCell>Lend Amount</TableCell>
        <TableCell align="center">Lend APR</TableCell>
        <TableCell align="right">
          <InfoTooltip
            title={
              'In the background, Fuji rebalances between these protocols to provide the best terms.'
            }
            isLeft
          />
          <span>Protocols</span>
        </TableCell>
        <TableCell align="center">
          <Stack
            direction="row"
            alignItems="center"
            spacing="0.25rem"
            justifyContent="right"
          >
            <DocsTooltip />
            <span>Safety Rating</span>
          </Stack>
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

function MyPositionsLendingTableContainer({
  children,
}: PositionsLendingTableElementProps) {
  return (
    <TableContainer>
      <Table aria-label="Positions дутвштп table" size="small">
        <MyPositionsLendingTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
