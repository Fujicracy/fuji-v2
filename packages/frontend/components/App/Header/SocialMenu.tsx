import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Link,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

import { SOCIAL_LINKS, SOCIAL_URL } from '../../../constants';
import { DiscordIcon } from '../../Shared/Icons';

function SocialMenu() {
  const { palette } = useTheme();

  return (
    <>
      {SOCIAL_LINKS.map((link) => (
        <Link key={link.title} href={link.url} target="_blank" rel="noreferrer">
          <MenuItem>
            <ListItemText>
              <Typography color={palette.info.main} variant="small">
                {link.title}
              </Typography>
            </ListItemText>
            {link.url === SOCIAL_URL.DISCORD ? (
              <DiscordIcon size={14} color={palette.info.main} />
            ) : (
              <TwitterIcon sx={{ fontSize: 14, color: palette.info.main }} />
            )}
          </MenuItem>
        </Link>
      ))}
    </>
  );
}

export default SocialMenu;
