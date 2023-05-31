import {
  Button,
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
import BestLabel from '../Markets/BestLabel';
import { NetworkIcon } from '../Shared/Icons';
import RoutesSteps from '../Shared/RoutesSteps';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';

type VaultProps = {
  selected: boolean;
  data: VaultWithFinancials & { route: RouteMeta };
  onChange: () => void;
};

function Vault({ selected, data, onChange }: VaultProps) {
  const { palette } = useTheme();

  const [isUnfolded, setUnfolded] = useState(false);

  const borderStyle = `1px solid ${
    selected ? alpha(palette.secondary.light, 0.5) : 'transparent'
  } !important`;

  console.log(data);

  return (
    <>
      <TableRow
        sx={{
          cursor: 'pointer',
          height: '3rem',
          borderRadius: '0.5rem',
          backgroundColor: selected
            ? `${palette.secondary.dark}`
            : 'transparent',
          '&:hover': {
            '& .MuiTableCell-root': { background: '#34363E' },
          },
          '& .MuiTableCell-root': {
            borderTop: borderStyle,
            '&:first-of-type': {
              borderTopLeftRadius: '0.5rem !important',
              borderLeft: borderStyle,
            },
            '&:last-of-type': {
              borderTopRightRadius: '0.5rem',
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
          >
            <IntegratedProviders
              providers={{
                status: 0,
                value: data.allProviders?.map((p) => p.name),
              }}
            />
            {data.route?.recommended && <BestLabel />}
          </Stack>
        </TableCell>
        <TableCell align="left">
          <SafetyRating
            rating={Number(data.vault?.safetyRating?.toString()) ?? 0}
          />
        </TableCell>
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
          <Typography variant="small" color={palette.success.main}>
            {data.activeProvider.borrowAprBase?.toFixed(2)} %
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="small" color={palette.warning.main}>
            {data.activeProvider.depositAprBase?.toFixed(2)} %
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            size="small"
            fullWidth
            variant="secondary"
            sx={{ p: '0 0.5rem' }}
            onClick={(e) => {
              e.stopPropagation();
              setUnfolded(!isUnfolded);
            }}
          >
            <Typography variant="small">
              {isUnfolded ? 'Close' : 'See Route'}
            </Typography>
          </Button>
        </TableCell>
      </TableRow>
      {isUnfolded && (
        <TableRow
          sx={{
            display: 'table-row',
            overflowY: 'hidden',
            '& .MuiTableCell-root': {
              borderBottom: borderStyle,
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
              {data.route.steps && <RoutesSteps steps={data.route.steps} />}
              <Stack direction="row" alignItems="center" gap={2} mt={1}>
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <Image
                    src="/assets/images/shared/cost.svg"
                    alt={'Cost icon'}
                    width={13}
                    height={13}
                  />
                  <Typography variant="xsmall" lineHeight="13px">
                    $3.90
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
                    2 mins
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
                    Price Impact On Collateral: 0.05%
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default Vault;
