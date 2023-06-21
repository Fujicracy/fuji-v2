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
import { CurrencyIcon, CurrencyWithNetworkIcon } from '../Shared/Icons';

type PositionYieldTableProps = {
  loading: boolean;
  days: number;
  callback: (value: number) => void;
};

function PositionYieldTable({
  loading,
  days,
  callback,
}: PositionYieldTableProps) {
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

  // TODO: move to parent
  useEffect(() => {
    callback(
      rows.reduce((a, c) => {
        return (
          a +
          getEstimatedEarnings({
            days,
            collateralInUsd: c.collateral.usdValue,
            collateralAPR: c.collateral.baseAPR,
            debtInUsd: c.debt.usdValue,
            debtAPR: c.debt.baseAPR,
          })
        );
      }, 0)
    );
  }, [rows, days, callback]);

  if (loading) {
    return (
      <PositionYieldTableContainer>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(6).fill('').map((_, index) => (
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
      {rows.map((row, i) => (
        <TableRow key={i}>
          <TableCell>
            <Stack direction="row" alignItems="center" pt={1} pb={1}>
              <CurrencyWithNetworkIcon
                currency={row.debt.symbol}
                network={chainName(row.chainId)}
                innerTop="1.1rem"
              />
              {row.debt.symbol}
            </Stack>
          </TableCell>
          <TableCell>
            <Stack direction="row" alignItems="center" pt={1} pb={1} gap={1}>
              <CurrencyIcon
                currency={row.collateral.symbol}
                width={32}
                height={32}
              />
              {row.collateral.symbol}
            </Stack>
          </TableCell>
          <TableCell align="right">
            <Typography variant="small" color={palette.warning.main}>
              {formatValue(row.debt.baseAPR)}%
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography variant="small" color={palette.success.main}>
              {formatValue(row.collateral.baseAPR)}%
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography variant="small">
              {formatValue(
                Number(row.collateral.baseAPR) - Number(row.debt.baseAPR)
              )}
              %
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography variant="small">
              {formatValue(
                getEstimatedEarnings({
                  days,
                  collateralInUsd: row.collateral.usdValue,
                  collateralAPR: row.collateral.baseAPR,
                  debtInUsd: row.debt.usdValue,
                  debtAPR: row.debt.baseAPR,
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
        <TableCell align="right">Borrow APY</TableCell>
        <TableCell align="right">Supply APY</TableCell>
        <TableCell align="right">Net APY</TableCell>
        <TableCell align="right">Est. Yield/Cost</TableCell>
      </TableRow>
    </TableHead>
  );
}

function PositionYieldTableContainer({
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
        <PositionYieldTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
