import {
  Box,
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

import { DUST_AMOUNT } from '../../constants/borrow';
import { recommendedLTV } from '../../helpers/assets';
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
import { TokenIcon, TokenWithNetworkIcon } from '../Shared/Icons';
import EmptyState from './EmptyState';
import LiquidationBox from './LiquidationBox';

type PositionsBorrowTableProps = {
  loading: boolean;
};

function MyPositionsBorrowTable({ loading }: PositionsBorrowTableProps) {
  const { palette } = useTheme();
  const router = useRouter();
  const account = useAuth((state) => state.address);
  const allPositions = usePositions((state) => state.positions);
  const [rows, setRows] = useState<PositionRow[]>([]);

  const positions = allPositions.filter(
    (p) => p.collateral.amount > DUST_AMOUNT && p.debt.amount > DUST_AMOUNT
  );

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (!account) {
    return (
      <MyPositionsBorrowTableContainer>
        <EmptyState reason="no-wallet" />
      </MyPositionsBorrowTableContainer>
    );
  }
  if (loading) {
    return (
      <MyPositionsBorrowTableContainer>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(7).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </MyPositionsBorrowTableContainer>
    );
  }

  function handleClick(row: PositionRow) {
    const entity = vaultFromAddress(row.address);
    showPosition(router, String(entity?.chainId), entity);
  }

  return (
    <MyPositionsBorrowTableContainer>
      {rows.length > 0 ? (
        rows.map((row, i) => (
          <TableRow
            key={i}
            sx={{ cursor: 'pointer' }}
            onClick={() => handleClick(row)}
          >
            <TableCell>
              <Stack direction="row" alignItems="center">
                <TokenWithNetworkIcon
                  token={row.debt.symbol}
                  network={chainName(row.chainId)}
                  innertTop="1.1rem"
                />
                {row.debt.symbol}
              </Stack>
            </TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" gap={1}>
                <TokenIcon
                  token={row.collateral.symbol}
                  width={32}
                  height={32}
                />
                {row.collateral.symbol}
              </Stack>
            </TableCell>
            <TableCell align="right">
              <Typography variant="small" color={palette.warning.main}>
                {row.apr}%
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Box pt={1} pb={1}>
                <Typography variant="small">
                  {formatValue(row.debt.usdValue, {
                    style: 'currency',
                    minimumFractionDigits: 0,
                  })}
                </Typography>
                <br />
                <Typography variant="small" color={palette.info.main}>
                  {formatValue(row.debt.amount)} {row.debt.symbol}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="right">
              <Box pt={1} pb={1}>
                <Typography variant="small">
                  {formatValue(row.collateral.usdValue, {
                    style: 'currency',
                    maximumFractionDigits: 0,
                  })}
                </Typography>
                <br />
                <Typography variant="small" color={palette.info.main}>
                  {formatValue(row.collateral.amount)} {row.collateral.symbol}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="right">
              {formatValue(row.oraclePrice, {
                style: 'currency',
                minimumFractionDigits: 0,
              })}
            </TableCell>
            <LiquidationBox
              liquidationPrice={row.liquidationPrice}
              percentPriceDiff={row.percentPriceDiff}
              recommendedLtv={recommendedLTV(row.ltvMax)}
            />
          </TableRow>
        ))
      ) : (
        <EmptyState reason="no-positions" />
      )}
    </MyPositionsBorrowTableContainer>
  );
}

export default MyPositionsBorrowTable;

type PositionsBorrowTableElementProps = {
  children: string | JSX.Element | JSX.Element[];
};

function MyPositionsBorrowTableHeader() {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell>Borrow</TableCell>
        <TableCell>Collateral</TableCell>
        <TableCell align="right">Debt APR</TableCell>
        <TableCell align="right">Borrowed</TableCell>
        <TableCell align="right">Collateral value</TableCell>
        <TableCell align="right">Oracle price</TableCell>
        <TableCell align="right">Liquidation Price</TableCell>
      </TableRow>
    </TableHead>
  );
}

function MyPositionsBorrowTableContainer({
  children,
}: PositionsBorrowTableElementProps) {
  return (
    <TableContainer>
      <Table aria-label="Positions table" size="small">
        <MyPositionsBorrowTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
