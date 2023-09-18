import { Button, Dialog, Link, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { PATH, SHUTDOWN_BLOG_POST_URL } from '../../constants';
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
        <ModalHeader title="🚨 Attention 🚨" onClose={onClose} />

        <Typography
          mb="1.5rem"
          sx={{
            fontSize: '0.875rem',
            minHeight: '2.625rem',
            textAlign: 'center',
          }}
        >
          Fuji Finance recently announced that they are closing down the company
          and halting all work to the protocol.
          <br />
          <Typography
            mt="0.25rem"
            sx={{
              fontSize: '0.875rem',
              minHeight: '2.625rem',
            }}
          >
            Please close your positions, and withdraw your funds prior to Dec
            31th. For more information, please refer to the announcement
            <Link
              href={SHUTDOWN_BLOG_POST_URL}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'inline-block',
                ml: '0.2rem',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              here
            </Link>
            .
          </Typography>
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
