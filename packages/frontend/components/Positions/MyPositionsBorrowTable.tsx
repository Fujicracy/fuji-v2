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
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { recommendedLTV } from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { aprData, vaultFromEntity } from '../../helpers/markets';
import { showPosition } from '../../helpers/navigation';
import {
  getRows,
  PositionRow,
  vaultFromAddress,
} from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { useMarkets } from '../../store/markets.store';
import { usePositions } from '../../store/positions.store';
import AprValue from '../Shared/AprValue';
import { CurrencyIcon, NetworkIcon } from '../Shared/Icons';
import ExtraTableSpace from '../Shared/Table/ExtraTableSpace';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';
import { InfoTooltip, RebalanceTooltip } from '../Shared/Tooltips';
import EmptyState from './EmptyState';
import LiquidationBox from './LiquidationBox';

type PositionsBorrowTableProps = {
  loading: boolean;
};

const NUMBER_OF_COLUMNS = 8;

function MyPositionsBorrowTable({ loading }: PositionsBorrowTableProps) {
  const router = useRouter();

  const account = useAuth((state) => state.address);
  const markets = useMarkets((state) => state.rows);
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
      <MyPositionsBorrowTableContainer>
        <EmptyState reason="no-wallet" columnsCount={NUMBER_OF_COLUMNS} />
      </MyPositionsBorrowTableContainer>
    );
  }
  if (loading) {
    return (
      <MyPositionsBorrowTableContainer>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(NUMBER_OF_COLUMNS).fill('').map((_, index) => (
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
    showPosition(router, true, entity, entity?.chainId);
  }

  return (
    <MyPositionsBorrowTableContainer>
      {rows.length > 0 ? (
        <>
          {rows.map((row, i) => {
            const match = markets.find((m) => {
              const vault = vaultFromEntity(m.entity);
              return (
                vault?.address.value === row.address &&
                vault?.chainId === row.chainId
              );
            });
            const apr = match
              ? aprData(match.borrowAprBase.value, match.borrowAprReward.value)
              : aprData(Number(row.apr), 0);
            return (
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
                    <CurrencyIcon
                      currency={row.debt.symbol}
                      width={24}
                      height={24}
                    />
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
                    <CurrencyIcon
                      currency={row.collateral.symbol}
                      width={24}
                      height={24}
                    />
                    <Typography variant="small" fontWeight={500} ml="0.5rem">
                      {formatValue(row.collateral.amount)}{' '}
                      {row.collateral.symbol}
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
                <TableCell align="right">
                  <AprValue
                    base={apr.base}
                    reward={apr.reward}
                    positive={apr.positive}
                  />
                </TableCell>
                <TableCell align="right">
                  <IntegratedProviders
                    providers={{
                      status: 0,
                      value: row.activeProvidersNames || [],
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <SafetyRating rating={row.safetyRating} />
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
                  ltv={row.ltv}
                  recommendedLtv={recommendedLTV(row.ltvMax)}
                />
              </TableRow>
            );
          })}
          <ExtraTableSpace colSpan={7} itemLength={rows.length} max={5} />
        </>
      ) : (
        <EmptyState reason="no-positions" columnsCount={NUMBER_OF_COLUMNS} />
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
        <TableCell align="right">
          <Stack direction="row" alignItems="center" justifyContent="right">
            <RebalanceTooltip />
            Protocols
          </Stack>
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" alignItems="center" justifyContent="right">
            <InfoTooltip
              title={
                'We are in the process of developing a general risk framework that will consider various factors in the different money markets and will provide a comprehensive safety score for each Fuji vault.'
              }
              isLeft
            />
            Rating
          </Stack>
        </TableCell>
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
