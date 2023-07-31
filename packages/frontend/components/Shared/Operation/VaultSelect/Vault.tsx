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
import { VaultType, VaultWithFinancials } from '@x-fuji/sdk';
import Image from 'next/image';
import React, { createRef, useEffect, useRef, useState } from 'react';

import { AssetType } from '../../../../helpers/assets';
import { chainName } from '../../../../helpers/chains';
import { AprData, aprData } from '../../../../helpers/markets';
import { RouteMeta } from '../../../../helpers/routes';
import { stringifiedBridgeFeeSum } from '../../../../helpers/transactions';
import { vaultFromEntity } from '../../../../helpers/vaults';
import { useMarkets } from '../../../../store/markets.store';
import AprValue from '../../AprValue';
import BestLabel from '../../BestLabel';
import { NetworkIcon } from '../../Icons';
import RoutesSteps from '../../RoutesSteps';
import IntegratedProviders from '../../Table/IntegratedProviders';
import SafetyRating from '../../Table/SafetyRating';

type VaultProps = {
  type: VaultType;
  selected: boolean;
  data: VaultWithFinancials & { route: RouteMeta } & { index: number };
  onChange: () => void;
  setOpened: (props: { height: number; index: number }) => void;
  opened: boolean;
  isMobile: boolean;
};

function Vault({
  type,
  selected,
  data,
  onChange,
  setOpened,
  opened,
  isMobile,
}: VaultProps) {
  const { palette } = useTheme();

  const [height, setHeight] = useState(0);
  const [isHovered, setHovered] = useState(false);

  const markets = useMarkets((state) => state.borrow.rows);
  const stackRef = createRef<HTMLDivElement>();
  const aprRef = useRef<Partial<AprData>>(
    aprData(
      data.activeProvider.borrowAprBase || 0,
      data.activeProvider.borrowAprReward,
      AssetType.Collateral
    )
  );

  useEffect(() => {
    const match = markets.find((m) => {
      const vault = vaultFromEntity(m.entity);
      return (
        vault?.address.value === data.vault.address.value &&
        vault?.chainId === data.vault.chainId
      );
    });
    if (match) {
      aprRef.current = aprData(
        match.borrowAprBase.value,
        match.borrowAprReward.value
      );
    }
  }, [markets, data, aprRef]);

  const handleOpen = (e: { stopPropagation: () => void }) => {
    if (!stackRef.current) return;
    e.stopPropagation();
    setHeight(stackRef.current.clientHeight);
    setOpened({
      index: data.index,
      height: height || stackRef.current.clientHeight,
    });
  };

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
              ? `${palette.secondary.light}`
              : isHovered
              ? '#35353B'
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
        )}
        {(!isMobile || type === VaultType.LEND) && (
          <TableCell align="right">
            <AprValue
              base={data.activeProvider.depositAprBase ?? 0}
              reward={data.activeProvider.depositAprReward}
              positive={true}
              providerName={data.activeProvider.name}
            />
          </TableCell>
        )}
        {type === VaultType.BORROW && (
          <TableCell align="right">
            <AprValue
              base={aprRef.current.base ?? 0}
              reward={aprRef.current.reward}
              positive={aprRef.current.positive}
              providerName={data.activeProvider.name}
            />
          </TableCell>
        )}
        {!isMobile && (
          <TableCell>
            <Button
              size="small"
              fullWidth
              variant="secondary"
              sx={{ p: '0 0.5rem' }}
              onClick={handleOpen}
            >
              <Typography variant="small" fontSize="0.75rem">
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
              ? `${palette.secondary.light}`
              : isHovered
              ? '#35353B'
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
              ? `${palette.secondary.light}`
              : 'transparent',
            pb: '0.5rem',
          }}
        >
          <Collapse in={opened}>
            <Stack
              ref={stackRef}
              gap={1}
              sx={{
                pb: '0.75rem',
                '& .step-item:after': {
                  left: '1.3%',
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
