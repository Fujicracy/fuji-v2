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
      <div
        style={{
          display: 'flex',
          justifyContent: 'right',
          margin: '1.5rem',
        }}
      ></div>
    </footer>
  );
}

export default Footer;
