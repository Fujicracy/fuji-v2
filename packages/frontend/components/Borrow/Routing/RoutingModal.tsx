import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

import { useBorrow } from '../../../store/borrow.store';
import RouteCard from './RouteCard';

type RoutingModalProps = {
  isEditing: boolean;
  open: boolean;
  handleClose: () => void;
};

function RoutingModal({ isEditing, open, handleClose }: RoutingModalProps) {
  const { palette } = useTheme();
  const [selectedRoute, setSelectedRoute] = useState(0);
  const availableRoutes = useBorrow((state) => state.availableRoutes);
  const availableVaults = useBorrow((state) => state.availableVaults);
  const changeActiveVault = useBorrow((state) => state.changeActiveVault);

  function didSelectRoute(i: number) {
    if (selectedRoute !== i) {
      const vault = availableVaults.find(
        (v) => v.vault.address.value === availableRoutes[i].address
      );
      if (!vault) return;
      changeActiveVault(vault);
    }
    setSelectedRoute(i);
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={handleClose} open={open}>
      <DialogContent
        data-cy="routing-modal"
        sx={{
          p: '1.5rem',
          background: palette.secondary.contrastText,
          borderRadius: '1.125rem',
          border: `1px solid ${palette.secondary.light}`,
        }}
      >
        <CloseIcon
          data-cy="routing-modal-close-button"
          sx={{
            cursor: 'pointer',
            position: 'absolute',
            right: '2rem',
          }}
          onClick={handleClose}
        />
        <Typography variant="body2">Available Routes</Typography>

        {availableRoutes.map((route, i) => (
          <RouteCard
            key={i}
            onChange={() => didSelectRoute(i)}
            route={route}
            isEditing={isEditing}
            selected={i === selectedRoute}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
}

export default RoutingModal;
