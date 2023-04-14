import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Link,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

import { SOCIAL_URL } from '../../constants';
import { DiscordIcon } from './Icons';

function ParameterLinks() {
  const { palette } = useTheme();

  return (
    <>
      <Link href={SOCIAL_URL.DISCORD} target="_blank" rel="noreferrer">
        <MenuItem>
          <ListItemText>
            <Typography color={palette.info.main} variant="small">
              Help
            </Typography>
          </ListItemText>
          <DiscordIcon size={14} color={palette.info.main} />
        </MenuItem>
      </Link>
      <Link href={SOCIAL_URL.DISCORD} target="_blank" rel="noreferrer">
        <MenuItem>
          <ListItemText>
            <Typography color={palette.info.main} variant="small">
              Feedback
            </Typography>
          </ListItemText>
          <DiscordIcon size={14} color={palette.info.main} />
        </MenuItem>
      </Link>
      <Link href={SOCIAL_URL.TWITTER} target="_blank" rel="noreferrer">
        <MenuItem>
          <ListItemText>
            <Typography color={palette.info.main} variant="small">
              @FujiFinance
            </Typography>
          </ListItemText>
          <TwitterIcon sx={{ fontSize: 14, color: palette.info.main }} />
        </MenuItem>
      </Link>
    </>
  );
}

export default ParameterLinks;
