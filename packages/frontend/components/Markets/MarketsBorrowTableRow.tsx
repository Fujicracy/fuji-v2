import {
  Collapse,
  Stack,
  Table,
  TableBody,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { BorrowingVault, VaultWithFinancials } from '@x-fuji/sdk';
import { MouseEvent, useEffect, useState } from 'react';

import { AssetType } from '../../helpers/assets';
import {
  aprData,
  loaderOrError,
  MarketRow,
  MarketRowStatus,
} from '../../helpers/markets';
import { formatValue } from '../../helpers/values';
import AprValue from '../Shared/AprValue';
import BestLabel from '../Shared/BestLabel';
import { CurrencyIcon, NetworkIcon } from '../Shared/Icons';
import SizableTableCell from '../Shared/SizableTableCell';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';
import Toggle from '../Shared/Table/Toggle';

type MarketsTableRowProps = {
  row: MarketRow;
  onClick: (entity?: BorrowingVault | VaultWithFinancials) => void;
  openedByDefault?: boolean;
};

function MarketsBorrowTableRow({
  row,
  onClick,
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
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 5,
          }}
        >
          {row.debt && isHighLevelRow && (
            <Stack direction="row" gap={0.5} alignItems="center">
              <Toggle
                expandRow={expandRow}
                isVisible={Boolean(row.children && row.children.length > 0)}
                onClick={handleExpand}
              />
              <Stack
                direction="row"
                alignItems="center"
                flexWrap="nowrap"
                data-cy="market-row-debt"
              >
                <CurrencyIcon currency={row.debt} height={32} width={32} />
                <Typography ml="0.5rem" variant="small">
                  {row.debt}
                </Typography>
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="120px">
          {row.collateral && isHighLevelRow && (
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="nowrap"
              data-cy="market-row-collateral"
            >
              <CurrencyIcon currency={row.collateral} height={32} width={32} />
              <Typography ml="0.5rem" variant="small">
                {row.collateral}
              </Typography>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="200px">
          {!expandRow && loaderOrError(row.chain.status)}
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
                alignItems="center"
                flexWrap="nowrap"
                data-cy="market-row-network"
              >
                <NetworkIcon network={row.chain.value} width={24} height={24} />
                <Typography ml="0.5rem" mr="0.3rem" variant="small">
                  {row.chain.value}
                </Typography>
                {row.isBest && <BestLabel />}
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {!expandRow && loaderOrError(row.borrowApr.status)}
          {row.borrowApr.status === MarketRowStatus.Ready && !expandRow && (
            <AprValue
              base={borrowApr.base || 0}
              reward={borrowApr.reward}
              positive={borrowApr.positive}
              providerName={row.integratedProviders.value[0]}
            />
          )}
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="130px"
          sx={{ color: palette.success.main }}
        >
          {!expandRow && loaderOrError(row.depositApr.status)}
          {row.depositApr.status === MarketRowStatus.Ready && !expandRow && (
            <AprValue
              base={row.depositAprBase.value}
              reward={row.depositAprReward.value}
              providerName={row.integratedProviders.value[0]}
              type={AssetType.Debt}
              positive
            />
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="130px">
          {!expandRow && loaderOrError(row.integratedProviders.status)}
          {!expandRow && (
            <IntegratedProviders providers={row.integratedProviders} />
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {!expandRow && (
            <>
              {loaderOrError(row.safetyRating.status)}
              {row.safetyRating.status === MarketRowStatus.Ready && (
                <SafetyRating rating={row.safetyRating?.value} />
              )}
            </>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {!expandRow && loaderOrError(row.liquidity.status)}
          {row.liquidity.status === MarketRowStatus.Ready &&
            !expandRow &&
            formatValue(row.liquidity.value, {
              maximumSignificantDigits: 3,
              notation: 'compact',
              style: 'currency',
            })}
        </SizableTableCell>
      </TableRow>

      <TableRow>
        <SizableTableCell
          sx={{ p: 0, borderBottom: 'none !important' }}
          colSpan={8}
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
                  <MarketsBorrowTableRow row={collapsedRow} onClick={onClick} />
                </TableBody>
              </Table>
            ))}
          </Collapse>
        </SizableTableCell>
      </TableRow>
    </>
  );
}

export default MarketsBorrowTableRow;
