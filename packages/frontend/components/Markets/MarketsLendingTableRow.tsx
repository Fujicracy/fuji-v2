import {
  Chip,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { LendingVault, VaultWithFinancials } from '@x-fuji/sdk';
import { MouseEvent, useEffect, useState } from 'react';

import { AssetType } from '../../helpers/assets';
import { ratingToNote } from '../../helpers/ratings';
import { MarketRow, MarketRowStatus } from '../../store/types/markets';
import AprValue from '../Shared/AprValue';
import { NetworkIcon } from '../Shared/Icons';
import SizableTableCell from '../Shared/SizableTableCell';
import CurrencyTableItem from '../Shared/Table/CurrencyTableItem';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import Toggle from '../Shared/Table/Toggle';
import { loaderOrError } from './LoaderOrError';

type MarketsTableRowProps = {
  row: MarketRow;
  onClick: (entity?: LendingVault | VaultWithFinancials) => void;
  openedByDefault?: boolean;
};

function MarketsLendingTableRow({
  row,
  onClick,
  openedByDefault = false,
}: MarketsTableRowProps) {
  const { palette } = useTheme();
  const [expandRow, setExpandRow] = useState(openedByDefault);

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
        onClick={() => onClick(row.entity as LendingVault)}
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
          width="120px"
          align="left"
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 5,
          }}
        >
          {row.collateral && isHighLevelRow && (
            <Stack direction="row" gap={0.5} alignItems="center">
              <Toggle
                expandRow={expandRow}
                isVisible={Boolean(row.children && row.children.length > 0)}
                onClick={handleExpand}
              />
              <CurrencyTableItem
                currency={row.collateral}
                label={row.collateral}
                iconDimensions={32}
                dataCy="market-row-collateral"
              />
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="200px" align="left">
          {loaderOrError(row.chain.status)}
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
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.success.main }}
        >
          {!expandRow && loaderOrError(row.depositApr.status)}
          {row.depositApr.status === MarketRowStatus.Ready && !expandRow && (
            <Stack direction="row" alignItems="center" justifyContent="right">
              <AprValue
                base={row.depositAprBase.value}
                reward={row.depositAprReward.value}
                providerName={row.integratedProviders.value[0]}
                type={AssetType.Debt}
                positive
              />
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="130px">
          {!expandRow && loaderOrError(row.integratedProviders.status)}
          {!expandRow && row.integratedProviders.value && (
            <IntegratedProviders providers={row.integratedProviders} />
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {!expandRow && (
            <>
              {loaderOrError(row.safetyRating.status)}
              {row.safetyRating.status === MarketRowStatus.Ready && (
                <Chip
                  variant={row.safetyRating?.value > 75 ? 'success' : 'warning'}
                  label={ratingToNote(row.safetyRating?.value)}
                  sx={{ '& .MuiChip-label': { p: '0.25rem 0.5rem' } }}
                />
              )}
            </>
          )}
        </SizableTableCell>
      </TableRow>

      <TableRow>
        <SizableTableCell
          sx={{ p: 0, borderBottom: 'none !important' }}
          colSpan={8}
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
                  <MarketsLendingTableRow
                    row={collapsedRow}
                    onClick={onClick}
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

export default MarketsLendingTableRow;
