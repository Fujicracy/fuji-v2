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
import { useEffect, useState } from 'react';

import { chainName } from '../../helpers/chains';
import { getRows, PositionRow } from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { usePositions } from '../../store/positions.store';
import { TokenIcon, TokenWithNetworkIcon } from '../Shared/Icons';
import EmptyState from './EmptyState';

type PositionsBorrowTableProps = {
  loading: boolean;
};

function PositionYieldTable({ loading }: PositionsBorrowTableProps) {
  const { palette } = useTheme();
  const account = useAuth((state) => state.address);
  const positions = usePositions((state) => state.positions);
  const [rows, setRows] = useState<PositionRow[]>([]);

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (!account) {
    return (
      <PositionYieldTableContainer>
        <EmptyState reason="no-wallet" />
      </PositionYieldTableContainer>
    );
  }
  if (loading) {
    return (
      <PositionYieldTableContainer>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(2).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </PositionYieldTableContainer>
    );
  }

  return (
    <PositionYieldTableContainer>
      {rows.length > 0 ? (
        rows.map((row, i) => (
          <TableRow key={i} sx={{ cursor: 'pointer' }}>
            <TableCell>
              <Stack direction="row" alignItems="center" pt={1} pb={1}>
                <TokenWithNetworkIcon
                  token={row.debt.symbol}
                  network={chainName(row.chainId)}
                  innertTop="1.1rem"
                />
                {row.debt.symbol}
              </Stack>
            </TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" pt={1} pb={1} gap={1}>
                <TokenIcon
                  token={row.collateral.symbol}
                  width={32}
                  height={32}
                />
                {row.collateral.symbol}
              </Stack>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <EmptyState reason="no-positions" />
      )}
    </PositionYieldTableContainer>
  );
}

export default PositionYieldTable;

type PositionYieldTableElementProps = {
  children: string | JSX.Element | JSX.Element[];
};

function PositionYieldTableHeader() {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell>Borrow</TableCell>
        <TableCell>Collateral</TableCell>
      </TableRow>
    </TableHead>
  );
}

function PositionYieldTableContainer({
  children,
}: PositionYieldTableElementProps) {
  return (
    <TableContainer>
      <Table aria-label="Positions table" size="small">
        <PositionYieldTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
