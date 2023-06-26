import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import ModalHeaderTitle from './ModalHeaderTitle';

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const { palette } = useTheme();

  return (
    <>
      <Box
        width="2rem"
        height="2rem"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: palette.secondary.main,
          borderRadius: '100px',
          cursor: 'pointer',
          float: 'right',
        }}
        onClick={onClose}
      >
        <CloseIcon fontSize="small" />
      </Box>
      <ModalHeaderTitle title={title} />
    </>
  );
}

export default ModalHeader;
