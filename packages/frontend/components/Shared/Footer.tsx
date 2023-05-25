import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

function Footer() {
  const { palette } = useTheme();

  return (
    <footer
      style={{
        width: '100%',
        bottom: 0,
        color: palette.text.secondary,
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          justifyContent: 'right',
          m: '1.5rem',
        }}
      ></Box>
    </footer>
  );
}

export default Footer;
