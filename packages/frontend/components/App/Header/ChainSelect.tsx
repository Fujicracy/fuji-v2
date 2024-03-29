import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import React from 'react';

import { chainName, chains, isSupported } from '../../../helpers/chains';
import { useAuth } from '../../../store/auth.store';
import { NetworkIcon } from '../../Shared/Icons';
import { TooltipWrapper } from '../../Shared/Tooltips';

function ChainSelect() {
  const theme = useTheme();
  const onMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [chainId, setChainId] = useAuth((state) => [
    state.chainId,
    state.changeChain,
  ]);
  const networkName = chainName(chainId);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const selectChain = (chainId: ChainId) => {
    setChainId(chainId);
    setAnchorEl(null);
  };

  const hasSupportedNetwork = networkName && isSupported(chainId);

  return (
    <>
      {/* {networkName && isSupported(chainId) ? ( */}
      <TooltipWrapper
        title={hasSupportedNetwork ? networkName : 'Switch network'}
        placement="bottom"
      >
        <Chip
          data-cy={
            hasSupportedNetwork
              ? 'network-button'
              : 'header-unsupported-network'
          }
          label={
            hasSupportedNetwork ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <ListItem
                  chainName={networkName}
                  selected={false}
                  onMobile={onMobile}
                  isOnlyIcon
                />
              </Stack>
            ) : (
              <WarningAmberIcon fontSize="small" sx={{ margin: '0 -0.2rem' }} />
            )
          }
          onClick={openMenu}
          sx={
            hasSupportedNetwork
              ? { '.MuiChip-label': { padding: '0 0.5rem' } }
              : {}
          }
        />
      </TooltipWrapper>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 1 }}
        PaperProps={{
          sx: { background: theme.palette.secondary.contrastText },
        }}
      >
        {chains.map((chain) => (
          <MenuItem
            data-cy="network-menu-item"
            key={chain.chainId}
            onClick={() => selectChain(chain.chainId)}
          >
            <ListItem
              chainName={chainName(chain.chainId)}
              selected={chainId === chain.chainId}
              onMobile={false}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

type ListItemProps = {
  chainName: string;
  selected: boolean;
  onMobile: boolean;
  isOnlyIcon?: boolean;
};

const ListItem = ({
  chainName,
  selected,
  onMobile,
  isOnlyIcon,
}: ListItemProps) => {
  const { palette } = useTheme();

  return (
    <>
      <ListItemIcon sx={{ minWidth: 'inherit' }}>
        <NetworkIcon network={chainName} height={20} width={20} />
      </ListItemIcon>
      {!onMobile && !isOnlyIcon && (
        <ListItemText
          data-cy="header-network"
          sx={{
            '& .MuiTypography-root': {
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
              fontWeight: 500,
            },
          }}
        >
          {chainName}
        </ListItemText>
      )}

      {selected && (
        <CheckIcon sx={{ color: palette.text.primary, ml: '2rem' }} />
      )}
    </>
  );
};

export default ChainSelect;
