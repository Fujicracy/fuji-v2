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
import { VaultType } from '@x-fuji/sdk';
import { useEffect, useState } from 'react';

import { chainName } from '../../helpers/chains';
import {
  getEstimatedEarnings,
  getRows,
  PositionRow,
} from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { Position } from '../../store/models/Position';
import { CurrencyWithNetworkIcon } from '../Shared/Icons';
import CurrencyTableItem from '../Shared/Table/CurrencyTableItem';
import EmptyState from './EmptyState';

type PositionYieldTableProps = {
  loading: boolean;
  days: number;
  positions: Position[];
  type: VaultType;
};

function PositionYieldTable({
  loading,
  days,
  positions,
  type,
}: PositionYieldTableProps) {
  const { palette } = useTheme();
  const account = useAuth((state) => state.address);
  const [rows, setRows] = useState<PositionRow[]>([]);

  const isLend = type === VaultType.LEND;
  const numberOfColumns = isLend ? 3 : 6;

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (loading) {
    return (
      <PositionYieldTableContainer isLend={isLend}>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(numberOfColumns).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </PositionYieldTableContainer>
    );
  }

  return (
    <PositionYieldTableContainer isLend={isLend}>
      {rows.length === 0 && positions.length === 0 ? (
        <EmptyState
          reason="no-positions"
          columnsCount={numberOfColumns}
          minHeight="10rem"
          type={type}
          withButton={false}
        />
      ) : (
        <>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {!isLend && row.debt && (
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
              )}
              <TableCell>
                <Stack direction="row" alignItems="center" pt={1} pb={1}>
                  <CurrencyTableItem
                    currency={row.collateral.symbol}
                    label={row.collateral.symbol}
                    iconDimensions={32}
                  />
                </Stack>
              </TableCell>
              {!isLend && row.debt && (
                <TableCell align="right">
                  <Typography variant="small" color={palette.warning.main}>
                    {formatValue(row.debt.baseAPR)}%
                  </Typography>
                </TableCell>
              )}
              <TableCell align="right">
                <Typography variant="small" color={palette.success.main}>
                  {formatValue(row.collateral.baseAPR)}%
                </Typography>
              </TableCell>
              {!isLend && row.debt && (
                <TableCell align="right">
                  <Typography variant="small">
                    {formatValue(
                      Number(row.collateral.baseAPR) - Number(row.debt.baseAPR)
                    )}
                    %
                  </Typography>
                </TableCell>
              )}
              <TableCell align="right">
                <Typography variant="small">
                  {formatValue(
                    getEstimatedEarnings({
                      days,
                      collateralInUsd: row.collateral.usdValue,
                      collateralAPR: row.collateral.baseAPR,
                      debtInUsd: row.debt ? row.debt.usdValue : 0,
                      debtAPR: row.debt ? row.debt.baseAPR : 0,
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
        </>
      )}
    </PositionYieldTableContainer>
  );
}

export default PositionYieldTable;

type PositionYieldTableElementProps = {
  isLend: boolean;
  children: string | JSX.Element | JSX.Element[];
};

function PositionYieldTableHeader({ isLend }: { isLend: boolean }) {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        {!isLend && <TableCell>Borrow</TableCell>}
        <TableCell>Collateral</TableCell>
        {!isLend && <TableCell align="right">Borrow APY</TableCell>}
        <TableCell align="right">Supply APY</TableCell>
        {!isLend && <TableCell align="right">Net APY</TableCell>}
        <TableCell align="right">Est. Yield/Cost</TableCell>
      </TableRow>
    </TableHead>
  );
}

function PositionYieldTableContainer({
  children,
  isLend,
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
        <PositionYieldTableHeader isLend={isLend} />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
