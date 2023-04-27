import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
  Chip,
  Collapse,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/system';
import { BorrowingVault, VaultWithFinancials } from '@x-fuji/sdk';
import { MouseEvent, useState } from 'react';

import { MarketRow, Status } from '../../helpers/markets';
import { formatValue } from '../../helpers/values';
import {
  DropletIcon,
  NetworkIcon,
  ProviderIcon,
  TokenIcon,
} from '../Shared/Icons';
import SizableTableCell from '../Shared/SizableTableCell';

type MarketsTableRowProps = {
  row: MarketRow;
  onClick: (entity?: BorrowingVault | VaultWithFinancials) => void;
};

function MarketsTableRow({ row, onClick }: MarketsTableRowProps) {
  const { palette } = useTheme();
  const [expandRow, setExpandRow] = useState(false);

  const handleExpand = (evt: MouseEvent) => {
    evt.stopPropagation();
    setExpandRow(!expandRow);
  };

  const loaderOrError = (status: Status) =>
    status === Status.Loading ? (
      <Skeleton />
    ) : status === Status.Error ? (
      <Tooltip title="Error loading data" arrow>
        <ErrorOutlineIcon />
      </Tooltip>
    ) : (
      <></>
    );

  return (
    <>
      <TableRow
        onClick={() => onClick(row.entity)}
        sx={{
          height: '3.438rem',
          cursor: 'pointer',
          '&:hover': { '& .MuiTableCell-root': { background: '#34363E' } },
        }}
      >
        <SizableTableCell
          width="160px"
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 5,
            background: row.isChild
              ? row.isGrandChild
                ? palette.secondary.light
                : palette.secondary.dark
              : palette.secondary.contrastText,
          }}
        >
          {row.debt && (
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              sx={{ opacity: row.isChild ? 0 : 1 }}
            >
              <Toggle
                expandRow={expandRow}
                isVisible={Boolean(row.children && row.children.length > 0)}
                onClick={handleExpand}
              />
              <Stack direction="row" alignItems="center" flexWrap="nowrap">
                <TokenIcon token={row.debt} height={32} width={32} />
                <Typography ml="0.5rem" variant="small">
                  {row.debt}
                </Typography>
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="120px">
          {row.collateral && (
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="nowrap"
              sx={{ opacity: row.isChild ? 0 : 1 }}
            >
              <TokenIcon token={row.collateral} height={32} width={32} />
              <Typography ml="0.5rem" variant="small">
                {row.collateral}
              </Typography>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="200px">
          {loaderOrError(row.chain.status)}
          {row.chain.status === Status.Ready && !expandRow && (
            <Stack direction="row" gap={0.5} alignItems="center">
              <Toggle
                expandRow={expandRow}
                isVisible={Boolean(row.isChild && row.children)}
                onClick={handleExpand}
              />
              <Stack direction="row" alignItems="center" flexWrap="nowrap">
                <NetworkIcon network={row.chain.value} width={24} height={24} />
                <Typography ml="0.5rem" variant="small">
                  {row.chain.value}
                </Typography>
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.warning.main }}
        >
          {loaderOrError(row.borrowApr.status)}
          {row.borrowApr.status === Status.Ready && !expandRow && (
            <Stack direction="row" alignItems="center" justifyContent="right">
              {row.borrowAprReward?.value > 0 && (
                <Tooltip
                  title={`${row.borrowAprBase.value.toFixed(
                    2
                  )}% (base) - ${row.borrowAprReward.value.toFixed(
                    2
                  )}% (reward)`}
                  arrow
                >
                  <IconButton>
                    <DropletIcon />
                  </IconButton>
                </Tooltip>
              )}
              {row.borrowApr.value.toFixed(2)} %
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="130px"
          sx={{ color: palette.success.main }}
        >
          {loaderOrError(row.depositApr.status)}
          {row.depositApr.status === Status.Ready && !expandRow && (
            <Stack direction="row" alignItems="center" justifyContent="right">
              {row.depositAprReward?.value > 0 && (
                <Tooltip
                  title={`${row.depositAprBase.value.toFixed(
                    2
                  )}% (base) + ${row.depositAprReward.value.toFixed(
                    2
                  )}% (reward)`}
                  arrow
                >
                  <IconButton>
                    <DropletIcon />
                  </IconButton>
                </Tooltip>
              )}
              {row.depositApr.value.toFixed(2)} %
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="130px">
          {loaderOrError(row.integratedProtocols.status)}
          {row.integratedProtocols.status === Status.Ready && !expandRow && (
            <Stack
              direction="row"
              justifyContent="right"
              alignItems="center"
              flexWrap="nowrap"
              sx={{
                mr: row.integratedProtocols.value.length > 1 ? '-0.25rem' : '0',
              }}
            >
              {row.integratedProtocols.value.map((name, i) => (
                <Tooltip key={name} title={name} arrow>
                  <Box
                    sx={{
                      position: 'relative',
                      right: `${i * 0.25}rem`,
                      zIndex: 4 - i,
                      height: '24px',
                    }}
                  >
                    {i <= 2 && (
                      <ProviderIcon provider={name} height={24} width={24} />
                    )}
                  </Box>
                </Tooltip>
              ))}
              {row.integratedProtocols.value.length >= 4 && (
                <Chip
                  label={
                    <Stack direction="row" justifyContent="center">
                      +{row.integratedProtocols.value.length - 3}
                    </Stack>
                  }
                  variant="number"
                />
              )}
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {!expandRow && (
            <Chip
              variant={row.safetyRating.value === 'A+' ? 'success' : 'warning'}
              label={row.safetyRating.value}
              sx={{ '& .MuiChip-label': { p: '0.25rem 0.5rem' } }}
            />
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {!expandRow && loaderOrError(row.liquidity.status)}
          {row.liquidity.status === Status.Ready &&
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
            timeout="auto"
            unmountOnExit
            sx={{
              background: row.isChild
                ? palette.secondary.light
                : palette.secondary.dark,
            }}
          >
            {row.children?.map((collaspsedRow, i) => (
              <Table key={i} sx={{ borderCollapse: 'initial' }}>
                <TableBody>
                  <MarketsTableRow row={collaspsedRow} onClick={onClick} />
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

type ToggleProps = {
  expandRow: boolean;
  isVisible: boolean;
  onClick: (e: MouseEvent) => void;
};

function Toggle(props: ToggleProps) {
  const { expandRow, isVisible, onClick } = props;

  const visibility = isVisible ? 'visible' : 'hidden';

  return (
    <IconButton onClick={onClick} size="small" sx={{ visibility }}>
      {expandRow ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
    </IconButton>
  );
}
