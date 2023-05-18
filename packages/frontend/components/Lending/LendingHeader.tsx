import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';

import { useBorrow } from '../../store/borrow.store';
import { AssetMeta } from '../../store/models/Position';
import VaultsMenu from '../Borrow/Overview/VaultsMenu';
import { NetworkIcon, TokenIcon } from '../Shared/Icons';
import LinkIcon from '../Shared/Icons/LinkIcon';
import { DocsTooltip } from '../Shared/Tooltips';

type LendingHeaderProps = {
  collateral: AssetMeta;
  loading: boolean;
};

function LendingHeader({ collateral, loading }: LendingHeaderProps) {
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const allProviders = useBorrow((state) => state.allProviders);
  const vault = useBorrow((state) => state.activeVault);
  const providers =
    allProviders && vault ? allProviders[vault.address.value] : [];

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      gap="0.75rem"
      width="100%"
    >
      <Stack flexDirection="row" alignItems="center" gap="0.75rem">
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <TokenIcon token={collateral.token} height={40} width={40} />
          <NetworkIcon
            network={collateral.token.chain.name}
            height={18}
            width={18}
            sx={{
              position: 'absolute',
              right: '0',
              transform: 'translateY(-100%)',
              zIndex: 1,
            }}
          />
        </Box>
        <Typography variant="h5" fontWeight={700}>
          Supply {collateral.token.symbol}
        </Typography>
        <Box
          sx={{
            p: '2px 0.5rem',
            backgroundColor: alpha('#FFFFFF', 0.03),
            borderRadius: '100px',
            border: `1px solid ${alpha('#3B404A', 0.5)}`,
          }}
        >
          <Typography variant="small">{collateral.token.chain.name}</Typography>
        </Box>
        <LinkIcon />
      </Stack>

      {!isMobile && providers && vault && (
        <Stack direction="row" alignItems="center">
          <DocsTooltip />
          <Typography variant="smallDark" ml={0.5} mr={1}>
            Safety rating:
          </Typography>
          <VaultsMenu
            providers={providers}
            safetyRating={Number(vault?.safetyRating?.toString())}
          />
        </Stack>
      )}
    </Stack>
  );
}

export default LendingHeader;
