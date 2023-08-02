import {
  Collapse,
  Stack,
  Table,
  TableBody,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { AbstractVault, VaultType, VaultWithFinancials } from '@x-fuji/sdk';
import { MouseEvent, useEffect, useState } from 'react';

import { AprType } from '../../helpers/assets';
import { aprData } from '../../helpers/markets';
import { formatValue } from '../../helpers/values';
import { MarketRow, MarketRowStatus } from '../../store/types/markets';
import AprValue from '../Shared/AprValue';
import BestLabel from '../Shared/BestLabel';
import { NetworkIcon } from '../Shared/Icons';
import CurrencyTableItem from '../Shared/Table/CurrencyTableItem';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';
import SizableTableCell from '../Shared/Table/SizableTableCell';
import Toggle from '../Shared/Table/Toggle';
import { loaderOrError } from './LoaderOrError';

type MarketsTableRowProps = {
  row: MarketRow;
  onClick: (entity?: AbstractVault | VaultWithFinancials) => void;
  type: VaultType;
  numberOfColumns: number;
  openedByDefault?: boolean;
};

function MarketsTableRow({
  row,
  onClick,
  type,
  numberOfColumns,
  openedByDefault = false,
}: MarketsTableRowProps) {
  const { palette } = useTheme();
  const [expandRow, setExpandRow] = useState(openedByDefault);

  const borrowApr = aprData(row.borrowAprBase.value, row.borrowAprReward.value);

  const handleExpand = (evt: MouseEvent) => {
    evt.stopPropagation();
    setExpandRow(!expandRow);
  };

  useEffect(() => {
    setExpandRow(openedByDefault);
  }, [openedByDefault]);

  const isHighLevelRow = !row.isChild && !row.isGrandChild;
  const shouldNetworkColumnBeShown =
    row.chain.status === MarketRowStatus.Ready &&
    (!isHighLevelRow || (isHighLevelRow && !expandRow));

  const isLend = type === VaultType.LEND;

  return (
    <>
      <TableRow
        data-cy="market-row"
        onClick={() => onClick(row.entity)}
        sx={{
          height: '3.438rem',
          cursor: 'pointer',
          '& .MuiTableCell-root': {
            background: row.isGrandChild
              ? palette.secondary.main
              : row.isChild
              ? palette.secondary.dark
              : palette.secondary.contrastText,
          },
          '&:hover': { '& .MuiTableCell-root': { background: '#34363E' } },
        }}
      >
        <SizableTableCell
          width="160px"
          align="left"
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 5,
          }}
        >
          {((!isLend && row.debt) || (isLend && row.collateral)) &&
            isHighLevelRow && (
              <Stack direction="row" gap={0.5} alignItems="center">
                <Toggle
                  expandRow={expandRow}
                  isVisible={Boolean(row.children && row.children.length > 0)}
                  onClick={handleExpand}
                />
                <CurrencyTableItem
                  currency={isLend ? row.collateral : row.debt || ''}
                  label={isLend ? row.collateral : row.debt || ''}
                  iconDimensions={32}
                  dataCy={`market-row-${isLend ? 'collateral' : 'debt'}`}
                />
              </Stack>
            )}
        </SizableTableCell>
        {!isLend && (
          <SizableTableCell width="160px">
            {row.collateral && isHighLevelRow && (
              <CurrencyTableItem
                currency={row.collateral}
                label={row.collateral}
                iconDimensions={32}
                dataCy="market-row-collateral"
              />
            )}
          </SizableTableCell>
        )}
        <SizableTableCell width="200px">
          {((isLend && !expandRow) || !isLend) &&
            loaderOrError(row.chain.status)}
          {shouldNetworkColumnBeShown && (
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              data-cy="market-row-network"
            >
              <Toggle
                expandRow={expandRow}
                isVisible={Boolean(row.isChild && row.children)}
                onClick={handleExpand}
              />
              <Stack
                direction="row"
                alignItems="left"
                flexWrap="nowrap"
                data-cy="market-row-network"
              >
                <NetworkIcon network={row.chain.value} width={24} height={24} />
                <Typography ml="0.5rem" mr="0.3rem" variant="small">
                  {row.chain.value}
                </Typography>
                {row.isBest && (
                  <BestLabel
                    aprType={isLend ? AprType.SUPPLY : AprType.BORROW}
                  />
                )}
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        {!isLend && (
          <SizableTableCell align="right" width="130px">
            {!expandRow && loaderOrError(row.borrowApr.status)}
            {row.borrowApr.status === MarketRowStatus.Ready && !expandRow && (
              <AprValue
                base={borrowApr.base || 0}
                reward={borrowApr.reward}
                aprType={AprType.BORROW}
                positive={borrowApr.positive}
                providerName={row.integratedProviders.value[0]}
              />
            )}
          </SizableTableCell>
        )}
        <SizableTableCell
          align="right"
          width="120px"
          sx={{ color: palette.success.main }}
        >
          {!expandRow && loaderOrError(row.depositApr.status)}
          {row.depositApr.status === MarketRowStatus.Ready && !expandRow && (
            <AprValue
              base={row.depositAprBase.value}
              reward={row.depositAprReward.value}
              providerName={row.integratedProviders.value[0]}
              aprType={AprType.SUPPLY}
              positive
            />
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="130px">
          {/*{!expandRow && loaderOrError(row.integratedProviders.status)}*/}
          {/*{!expandRow && (*/}
          <IntegratedProviders
            providers={{ status: 0, value: ['qwe', 'qweq', 'qweqdq'] }}
          />
          {/*)}*/}
        </SizableTableCell>
        <SizableTableCell align="right" width="130px">
          {!expandRow && (
            <>
              {loaderOrError(row.safetyRating.status)}
              {row.safetyRating.status === MarketRowStatus.Ready && (
                <SafetyRating rating={row.safetyRating?.value} />
              )}
            </>
          )}
        </SizableTableCell>
        {!isLend && (
          <SizableTableCell align="right" width="130px">
            {!expandRow && loaderOrError(row.liquidity.status)}
            {row.liquidity.status === MarketRowStatus.Ready &&
              !expandRow &&
              formatValue(row.liquidity.value, {
                maximumSignificantDigits: 3,
                notation: 'compact',
                style: 'currency',
              })}
          </SizableTableCell>
        )}
      </TableRow>

      <TableRow>
        <SizableTableCell
          sx={{ p: 0, borderBottom: 'none !important' }}
          colSpan={numberOfColumns}
          align="right"
        >
          <Collapse
            in={expandRow}
            timeout={{ enter: 500, exit: 200 }}
            unmountOnExit
          >
            {row.children?.map((collapsedRow, i) => (
              <Table
                key={`${i + collapsedRow.chain.value}`}
                sx={{ borderCollapse: 'initial' }}
              >
                <TableBody>
                  <MarketsTableRow
                    row={collapsedRow}
                    onClick={onClick}
                    type={type}
                    numberOfColumns={numberOfColumns}
                  />
                </TableBody>
              </Table>
            ))}
          </Collapse>
        </SizableTableCell>
      </TableRow>
    </>
  );
}

export default MarketsTableRow;
