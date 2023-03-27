import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, Grid, Link, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { DiscordIcon } from './Icons';

type Social = {
  id: string;
  url: string;
  image: React.ReactElement;
};

function Footer() {
  const { palette } = useTheme();

  const socials: Social[] = [
    {
      id: 'twitter',
      url: 'https://twitter.com/FujiFinance',
      image: (
        <TwitterIcon
          sx={{
            '&:hover': {
              color: palette.primary.main,
              textShadow: `${palette.primary.main} 0rem 0rem 0.125rem`,
            },
          }}
        />
      ),
    },
    {
      id: 'telegram',
      url: 'https://t.me/joinchat/U4cKWNCUevKVsrtY',
      image: (
        <TelegramIcon
          sx={{
            '&:hover': {
              color: palette.primary.main,
              textShadow: `${palette.primary.main} 0rem 0rem 0.125rem`,
            },
          }}
        />
      ),
    },
    {
      id: 'discord',
      url: 'https://discord.com/invite/dnvJeEMeDJ',
      image: <DiscordIcon />,
    },
  ];

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
          justifyContent: 'space-between',
          margin: '1.5rem',
        }}
      >
        <Box justifyContent="space-around">
          {socials.map((social: Social) => (
            <Link
              href={social.url}
              target="_blank"
              key={social.id}
              rel="noreferrer"
              sx={{ ml: '0.813rem' }}
            >
              {social.image}
            </Link>
          ))}
        </Box>

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
