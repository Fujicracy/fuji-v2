import { Button, Dialog, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { PATH } from '../../constants';
import { usePositions } from '../../store/positions.store';
import ModalHeader from '../Shared/ModalHeader';

function ShutdownNotice() {
  const [isShown, setIsShown] = useState<boolean>(true);
  const [hasPositions, setHasPositions] = useState<boolean>(false);

  const borrowPositions = usePositions((state) => state.borrowPositions);
  const lendingPositions = usePositions((state) => state.lendingPositions);

  useEffect(() => {
    if (borrowPositions.length || lendingPositions.length) {
      setHasPositions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const router = useRouter();

  const isOnMyPositionPage = router.pathname === PATH.MY_POSITIONS;

  const navigateToPositions = () => {
    !isOnMyPositionPage && router.push(PATH.MY_POSITIONS);
    setIsShown(false);
  };

  const onClose = () => setIsShown(false);

  return (
    <Dialog
      data-cy="explore-carousel"
      open={isShown}
      sx={{
        '.MuiPaper-root': { width: { xs: '100%', sm: '480px' } },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          maxWidth: '30rem',
          p: { xs: '1rem', sm: '1.5rem' },
        }}
      >
        <ModalHeader title="Shutdown Notice" onClose={onClose} />

        <Typography
          mb="1.5rem"
          sx={{
            fontSize: '0.875rem',
            minHeight: '2.625rem',
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Typography>

        <Button
          variant="gradient"
          size="large"
          onClick={hasPositions ? navigateToPositions : onClose}
          fullWidth
        >
          {!hasPositions
            ? 'Close'
            : isOnMyPositionPage
            ? 'Next'
            : 'To My Positions'}
        </Button>
      </Paper>
    </Dialog>
  );
}

export default ShutdownNotice;
