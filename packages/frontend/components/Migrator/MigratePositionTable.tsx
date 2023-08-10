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
} from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import { useEffect, useState } from 'react';

import { chainName } from '../../helpers/chains';
import { getRows, PositionRow } from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { Position } from '../../store/models/Position';
import EmptyState from '../Positions/EmptyState';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';

type PositionYieldTableProps = {
  loading: boolean;
  positions: Position[];
  type: VaultType;
};

function MigratePositionTable({
  loading,
  positions,
  type,
}: PositionYieldTableProps) {
  const account = useAuth((state) => state.address);
  const [rows, setRows] = useState<PositionRow[]>([]);

  const isLend = type === VaultType.LEND;
  const numberOfColumns = isLend ? 3 : 4;

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (loading) {
    return (
      <MigratePositionTableContainer isLend={isLend}>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(numberOfColumns).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </MigratePositionTableContainer>
    );
  }

  return (
    <MigratePositionTableContainer isLend={isLend}>
      {!account ? (
        <EmptyState
          reason="no-wallet"
          columnsCount={numberOfColumns}
          minHeight="10rem"
          type={type}
          withButton={true}
        />
      ) : rows.length === 0 && positions.length === 0 ? (
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
              <TableCell align="left">
                <Stack
                  direction="row"
                  justifyContent="flex-start"
                  alignItems="center"
                >
                  <ProviderIcon
                    provider={row.activeProvidersNames[0]}
                    width={24}
                    height={24}
                  />
                  <Typography variant="small" fontWeight={500}>
                    {row.activeProvidersNames[0]}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="left">
                <NetworkIcon
                  network={chainName(row.chainId)}
                  width={18}
                  height={18}
                />
              </TableCell>
              {!isLend && (
                <TableCell align="right">
                  <Typography variant="small" fontWeight={500}>
                    {formatValue(row.debt?.usdValue, {
                      style: 'currency',
                      minimumFractionDigits: 2,
                    })}
                  </Typography>
                </TableCell>
              )}
              <TableCell align="right">
                <Typography variant="small" fontWeight={500}>
                  {formatValue(row.collateral.usdValue, {
                    style: 'currency',
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </>
      )}
    </MigratePositionTableContainer>
  );
}

export default MigratePositionTable;

type PositionYieldTableElementProps = {
  isLend: boolean;
  children: string | JSX.Element | JSX.Element[];
};

function MigratePositionTableHeader({ isLend }: { isLend: boolean }) {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell align="left">Protocol</TableCell>
        <TableCell align="left">Chain</TableCell>
        {!isLend && <TableCell align="right">Borrow Value</TableCell>}
        <TableCell align="right">Collateral Value</TableCell>
      </TableRow>
    </TableHead>
  );
}

function MigratePositionTableContainer({
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
      <Table aria-label="Positions Migrator table" size="small">
        <MigratePositionTableHeader isLend={isLend} />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
