import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

function CloseButton({ onClose }: { onClose: () => void }) {
  const { palette } = useTheme();

  return (
    <Box
      width="1.5rem"
      height="1.5rem"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.secondary.main,
        borderRadius: '100px',
        cursor: 'pointer',
        float: 'right',
        '& svg': {
          width: '1rem',
          height: '1rem',
        },
        '&:hover': { background: '#34363E' },
      }}
      onClick={onClose}
    >
      <CloseIcon fontSize="small" />
    </Box>
  );
}

export default CloseButton;
