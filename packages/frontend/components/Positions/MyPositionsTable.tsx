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
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { AssetType, recommendedLTV } from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { aprData } from '../../helpers/markets';
import { showPosition } from '../../helpers/navigation';
import {
  getRows,
  PositionRow,
  vaultFromPosition,
} from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { vaultFromEntity } from '../../helpers/vaults';
import { useAuth } from '../../store/auth.store';
import { Position } from '../../store/models/Position';
import { usePositions } from '../../store/positions.store';
import { MarketRow } from '../../store/types/markets';
import AprValue from '../Shared/AprValue';
import { NetworkIcon } from '../Shared/Icons';
import CurrencyTableItem from '../Shared/Table/CurrencyTableItem';
import ExtraTableSpace from '../Shared/Table/ExtraTableSpace';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';
import { InfoTooltip, RebalanceTooltip } from '../Shared/Tooltips';
import EmptyState from './EmptyState';
import LiquidationBox from './LiquidationBox';

type MyPositionsTableProps = {
  type: VaultType;
  markets: MarketRow[];
  positions: Position[];
};

function MyPositionsTable({ type, positions, markets }: MyPositionsTableProps) {
  const router = useRouter();

  const account = useAuth((state) => state.address);
  const isLoading = usePositions((state) => state.loading);

  const loading = isLoading && positions.length === 0;
  const [rows, setRows] = useState<PositionRow[]>([]);

  const isLend = type === VaultType.LEND;
  const numberOfColumns = isLend ? 5 : 8;

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  if (!account) {
    return (
      <MyPositionsBorrowTableContainer isLend={isLend}>
        <EmptyState reason="no-wallet" columnsCount={numberOfColumns} />
      </MyPositionsBorrowTableContainer>
    );
  }
  if (loading) {
    return (
      <MyPositionsBorrowTableContainer isLend={isLend}>
        <TableRow sx={{ height: '2.625rem' }}>
          {new Array(numberOfColumns).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </MyPositionsBorrowTableContainer>
    );
  }

  function handleClick(row: PositionRow) {
    if (!row.address || !row.chainId) return;
    const entity = vaultFromPosition(type, row.address, row.chainId);
    showPosition(type, router, true, entity, entity?.chainId);
  }

  return (
    <MyPositionsBorrowTableContainer isLend={isLend}>
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
            const apr = !match
              ? aprData(
                  Number(row.apr),
                  0,
                  isLend ? AssetType.Debt : AssetType.Collateral
                )
              : isLend
              ? aprData(
                  match.depositApr.value,
                  match.depositAprReward.value,
                  AssetType.Debt
                )
              : aprData(match.borrowAprBase.value, match.borrowAprReward.value);

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
                {!isLend && (
                  <TableCell>
                    {row.debt && (
                      <Stack direction="row" alignItems="center">
                        <CurrencyTableItem
                          currency={row.debt.symbol}
                          label={`${formatValue(row.debt.amount)} ${
                            row.debt.symbol
                          }`}
                          iconDimensions={24}
                          dataCy="market-row-collateral"
                        />
                        <Typography variant="xsmall" ml="0.25rem">
                          (
                          {formatValue(row.debt.usdValue, {
                            style: 'currency',
                            minimumFractionDigits: 2,
                          })}
                          )
                        </Typography>
                      </Stack>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Stack direction="row" alignItems="center">
                    <CurrencyTableItem
                      currency={row.collateral.symbol}
                      label={`${formatValue(row.collateral.amount)}  ${
                        row.collateral.symbol
                      }`}
                      iconDimensions={24}
                      dataCy="market-row-collateral"
                    />
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
                    base={apr.base || 0}
                    reward={apr.reward}
                    positive={apr.positive}
                    providerName={row.activeProvidersNames[0]}
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
                {!isLend && (
                  <TableCell align="right">
                    {formatValue(row.oraclePrice, {
                      style: 'currency',
                      minimumFractionDigits: 0,
                    })}
                  </TableCell>
                )}
                {!isLend && (
                  <LiquidationBox
                    liquidationPrice={row.liquidationPrice}
                    percentPriceDiff={row.percentPriceDiff}
                    ltv={row.ltv}
                    recommendedLtv={recommendedLTV(row.ltvMax)}
                  />
                )}
              </TableRow>
            );
          })}
          <ExtraTableSpace
            colSpan={numberOfColumns}
            itemLength={rows.length}
            max={5}
          />
        </>
      ) : (
        <EmptyState
          reason="no-positions"
          columnsCount={numberOfColumns}
          type={type}
        />
      )}
    </MyPositionsBorrowTableContainer>
  );
}

export default MyPositionsTable;

type PositionsBorrowTableElementProps = {
  isLend: boolean;
  children: string | JSX.Element | JSX.Element[];
};

function MyPositionsBorrowTableHeader({ isLend }: { isLend: boolean }) {
  return (
    <TableHead>
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell>Network</TableCell>
        {!isLend && <TableCell>Borrow Amount</TableCell>}
        <TableCell>{isLend ? 'Lend' : 'Collateral'} Amount</TableCell>
        <TableCell align="right">{isLend ? 'Lend' : 'Borrow'} APR</TableCell>
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
        {!isLend && <TableCell align="center">Oracle price</TableCell>}
        {!isLend && (
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
        )}
      </TableRow>
    </TableHead>
  );
}

function MyPositionsBorrowTableContainer({
  children,
  isLend,
}: PositionsBorrowTableElementProps) {
  return (
    <TableContainer>
      <Table aria-label="Positions table" size="small">
        <MyPositionsBorrowTableHeader isLend={isLend} />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
