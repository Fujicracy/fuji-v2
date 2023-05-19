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
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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
import { NetworkIcon, TokenIcon } from '../Shared/Icons';
import ExtraTableSpace from '../Shared/Table/ExtraTableSpace';
import InfoTooltip from '../Shared/Tooltips/InfoTooltip';
import EmptyState from './EmptyState';
import LiquidationBox from './LiquidationBox';

function MyPositionsBorrowTable() {
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
                  <TokenIcon token={row.debt.symbol} width={24} height={24} />
                  <Typography variant="small" fontWeight={500} ml="0.5rem">
                    {formatValue(row.debt.amount)} {row.debt.symbol}
                  </Typography>
                  <Typography variant="xsmall" ml="0.25rem">
                    (
                    {formatValue(row.debt.usdValue, {
                      style: 'currency',
                      minimumFractionDigits: 2,
                    })}
                    )
                  </Typography>
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
              <TableCell align="center">
                {formatValue(row.oraclePrice, {
                  style: 'currency',
                  minimumFractionDigits: 0,
                })}
              </TableCell>
              <LiquidationBox
                liquidationPrice={row.liquidationPrice}
                percentPriceDiff={row.percentPriceDiff}
                ltv={row.ltv}
                recommendedLtv={recommendedLTV(row.ltvMax)}
              />
            </TableRow>
          ))}
          <ExtraTableSpace colSpan={7} itemLength={rows.length} max={5} />
        </>
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
        <TableCell>Network</TableCell>
        <TableCell>Borrow Amount</TableCell>
        <TableCell>Collateral Amount</TableCell>
        <TableCell align="center">Borrow APR</TableCell>
        <TableCell align="center">Oracle price</TableCell>
        <TableCell align="right">
          <Stack direction="row" alignItems="center" justifyContent="right">
            <InfoTooltip
              title={
                'When the price of the provided collateral drops below the indicated liquidation price, your position is going to be liquidated.'
              }
              isLeft
            />
            Liquidation price
          </Stack>
        </TableCell>
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
