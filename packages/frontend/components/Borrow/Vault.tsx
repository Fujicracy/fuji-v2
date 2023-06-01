import {
  Button,
  Collapse,
  Stack,
  TableCell,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { VaultWithFinancials } from '@x-fuji/sdk';
import Image from 'next/image';
import React, { useState } from 'react';

import { chainName } from '../../helpers/chains';
import { RouteMeta } from '../../helpers/routing';
import { stringifiedBridgeFeeSum } from '../../helpers/transactions';
import BestLabel from '../Markets/BestLabel';
import { NetworkIcon } from '../Shared/Icons';
import RoutesSteps from '../Shared/RoutesSteps';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';

type VaultProps = {
  selected: boolean;
  data: VaultWithFinancials & { route: RouteMeta };
  onChange: () => void;
  setOpened: () => void;
  opened: boolean;
  isMobile: boolean;
};

function Vault({
  selected,
  data,
  onChange,
  setOpened,
  opened,
  isMobile,
}: VaultProps) {
  const { palette } = useTheme();

  const [isHovered, setHovered] = useState(false);

  const borderStyle = `1px solid ${
    selected ? alpha(palette.secondary.light, 0.5) : 'transparent'
  } !important`;

  return (
    <>
      <TableRow
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          cursor: 'pointer',
          height: '3rem',
          borderRadius: '0.5rem',
          '& .MuiTableCell-root': {
            background: selected
              ? `${palette.secondary.dark}`
              : isHovered
              ? '#34363E'
              : 'transparent',
            borderTop: borderStyle,
            '&:first-of-type': {
              borderTopLeftRadius: '0.5rem !important',
              borderBottomLeftRadius: opened ? '0' : '0.5rem',
              borderLeft: borderStyle,
            },
            '&:last-of-type': {
              borderTopRightRadius: '0.5rem',
              borderBottomRightRadius: opened ? '0' : '0.5rem',
              borderRight: borderStyle,
            },
          },
        }}
        onClick={onChange}
      >
        <TableCell align="left">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="start"
            gap={1.3}
            sx={{
              minWidth: !isMobile ? '8.6rem' : 'auto',
            }}
          >
            <IntegratedProviders
              providers={{
                status: 0,
                value: data.allProviders?.map((p) => p.name),
              }}
            />
            {data.route?.recommended ? (
              <BestLabel />
            ) : (
              <Stack sx={{ width: '3.7rem' }} />
            )}
          </Stack>
        </TableCell>
        <TableCell align="left">
          <SafetyRating
            rating={Number(data.vault?.safetyRating?.toString()) ?? 0}
          />
        </TableCell>
        {!isMobile && (
          <>
            <TableCell align="left">
              <Stack direction="row" alignItems="center" gap="0.5rem">
                <NetworkIcon
                  network={chainName(data.vault.chainId)}
                  width={18}
                  height={18}
                />
                {chainName(data.vault.chainId)}
              </Stack>
            </TableCell>
            <TableCell align="right">
              <Typography variant="small" color={palette.warning.main}>
                {data.activeProvider.depositAprBase?.toFixed(2)} %
              </Typography>
            </TableCell>
          </>
        )}
        <TableCell align="right">
          <Typography variant="small" color={palette.success.main}>
            {data.activeProvider.borrowAprBase?.toFixed(2)} %
          </Typography>
        </TableCell>
        {!isMobile && (
          <TableCell>
            <Button
              size="small"
              fullWidth
              variant="secondary"
              sx={{ p: '0 0.5rem' }}
              onClick={(e) => {
                e.stopPropagation();
                setOpened();
              }}
            >
              <Typography variant="small">
                {opened ? 'Close' : 'See Route'}
              </Typography>
            </Button>
          </TableCell>
        )}
      </TableRow>
      <TableRow
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          display: 'table-row',
          overflowY: 'hidden',
          cursor: 'pointer',
          '& .MuiTableCell-root': {
            background: selected
              ? `${palette.secondary.dark}`
              : isHovered
              ? '#34363E'
              : 'transparent',
            borderBottom: opened ? borderStyle : 'none',
            '&:first-of-type': {
              borderBottomLeftRadius: '0.5rem !important',
              borderLeft: borderStyle,
            },
            '&:last-of-type': {
              borderBottomRightRadius: '0.5rem',
              borderRight: borderStyle,
            },
          },
        }}
      >
        <TableCell
          onClick={onChange}
          colSpan={6}
          sx={{
            borderStyle: 'unset',
            backgroundColor: selected
              ? `${palette.secondary.dark}`
              : 'transparent',
            pb: '0.5rem',
          }}
        >
          <Collapse in={opened}>
            <Stack
              gap={1}
              sx={{
                pb: '0.75rem',
                '& .step-item:after': {
                  left: '1.6%',
                  transform: 'translateY(45%)',
                },
              }}
            >
              {data.route?.steps && <RoutesSteps steps={data.route.steps} />}
              <Stack direction="row" alignItems="center" gap={2} mt={1}>
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <Image
                    src="/assets/images/shared/cost.svg"
                    alt={'Cost icon'}
                    width={13}
                    height={13}
                  />
                  <Typography variant="xsmall" lineHeight="13px">
                    {`$${stringifiedBridgeFeeSum(
                      data.route?.bridgeFees
                    )} + gas`}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <Image
                    src="/assets/images/shared/time.svg"
                    alt={'Time icon'}
                    width={13}
                    height={13}
                  />
                  <Typography variant="xsmall" lineHeight="13px">
                    {`${data.route?.estimateTime / 60} Mins`}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <Image
                    src="/assets/images/shared/priceImpact.svg"
                    alt={'Price impact icon'}
                    width={13}
                    height={13}
                  />
                  <Typography variant="xsmall" lineHeight="13px">
                    Price Impact On Collateral:
                    <Typography
                      ml={0.3}
                      variant="xsmall"
                      lineHeight="13px"
                      color={
                        (data.route?.estimateSlippage || 0) * -1 >= 0
                          ? palette.success.main
                          : palette.warning.main
                      }
                    >
                      {`${(data.route?.estimateSlippage || 0) * -1} %`}
                    </Typography>
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default Vault;
