import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

function CloseButton({
  onClose,
  dimensionSize,
}: {
  onClose: () => void;
  dimensionSize?: number;
}) {
  const { palette } = useTheme();
  const outerSize = dimensionSize || 24;
  const svgSize = (outerSize * 2) / 3;

  return (
    <Box
      width={`${outerSize}px`}
      height={`${outerSize}px`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.secondary.main,
        borderRadius: '100px',
        cursor: 'pointer',
        float: 'right',
        '& svg': {
          width: `${svgSize}px`,
          height: `${svgSize}px`,
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
