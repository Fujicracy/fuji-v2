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
import { useEffect, useState } from 'react';

import { chainName } from '../../helpers/chains';
import {
  getEstimatedEarnings,
  getRows,
  PositionRow,
} from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { usePositions } from '../../store/positions.store';
import { CurrencyWithNetworkIcon } from '../Shared/Icons';

type PositionLendYieldTableProps = {
  loading: boolean;
  days: number;
};

function PositionLendYieldTable({
  loading,
  days,
}: PositionLendYieldTableProps) {
  const { palette } = useTheme();
  const account = useAuth((state) => state.address);
  const positions = usePositions((state) => state.lendingPositions);
  const [rows, setRows] = useState<PositionRow[]>([]);

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (loading) {
    return (
      <PositionLendYieldTableContainer>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(3).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </PositionLendYieldTableContainer>
    );
  }

  return (
    <PositionLendYieldTableContainer>
      {rows.map((row, i) => (
        <TableRow key={i}>
          <TableCell>
            <Stack direction="row" alignItems="center" pt={1} pb={1} gap={1}>
              <CurrencyWithNetworkIcon
                currency={row.collateral.symbol}
                network={chainName(row.chainId)}
                innerTop="1.1rem"
              />
              {row.collateral.symbol}
            </Stack>
          </TableCell>
          <TableCell align="center">
            <Typography variant="small" color={palette.success.main}>
              {formatValue(row.collateral.baseAPR)}%
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography variant="small">
              {formatValue(
                getEstimatedEarnings({
                  days,
                  collateralInUsd: row.collateral.usdValue,
                  collateralAPR: row.collateral.baseAPR,
                  debtInUsd: 0,
                  debtAPR: 0,
                }),
                {
                  style: 'currency',
                  maximumFractionDigits: 2,
                }
              )}
            </Typography>
          </TableCell>
        </TableRow>
      ))}
    </PositionLendYieldTableContainer>
  );
}

export default PositionLendYieldTable;

type PositionYieldTableElementProps = {
  children: string | JSX.Element | JSX.Element[];
};

function PositionLendYieldTableHeader() {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell>Lending Asset</TableCell>
        <TableCell align="center">Lend APY</TableCell>
        <TableCell align="right">Est. Yield/Cost</TableCell>
      </TableRow>
    </TableHead>
  );
}

function PositionLendYieldTableContainer({
  children,
}: PositionYieldTableElementProps) {
  return (
    <TableContainer
      sx={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      <Table aria-label="Positions yields table" size="small">
        <PositionLendYieldTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
