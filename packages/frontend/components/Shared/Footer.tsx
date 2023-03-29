import { Grid, Link, Typography } from '@mui/material';
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
      >
        <Typography variant="xsmall">
          <Grid container columnGap="1rem">
            <Grid item>
              <Link href="/about" target="_blank">
                About
              </Link>
            </Grid>
            <Grid item>
              <Link
                href="https://docs.fujidao.org"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Grid>
            <Grid item>© Fuji Finance {new Date().getFullYear()}</Grid>
          </Grid>
        </Typography>
      </div>
    </footer>
  );
}

export default Footer;
