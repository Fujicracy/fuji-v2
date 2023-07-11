import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Link,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { HELPER_URL, HelperLink } from '../../../constants';
import { fetchGuardedLaunchAddresses } from '../../../helpers/guardedLaunch';
import { HELPER_LINKS } from '../../../helpers/navigation';
import { useAuth } from '../../../store/auth.store';
import { DiscordIcon } from '../../Shared/Icons';

function SocialMenu() {
  const { palette } = useTheme();
  const [links, setLinks] = useState<HelperLink[]>([]);
  const walletAddress = useAuth((state) => state.address);

  useEffect(() => {
    fetchGuardedLaunchAddresses().then((addresses) => {
      let filteredLinks = HELPER_LINKS.filter(
        (link) => !link.isForGuardedLaunchUsers
      );
      if (addresses.includes(walletAddress || '')) {
        filteredLinks = HELPER_LINKS;
      }

      setLinks(filteredLinks);
    });
  }, [walletAddress]);

  return (
    <>
      {links.map((link) => (
        <Link key={link.title} href={link.url} target="_blank" rel="noreferrer">
          <MenuItem>
            <ListItemText>
              <Typography color={palette.info.main} variant="small">
                {link.title}
              </Typography>
            </ListItemText>
            {link.url === HELPER_URL.DISCORD ? (
              <DiscordIcon size={14} color={palette.info.main} />
            ) : link.url === HELPER_URL.TWITTER ? (
              <TwitterIcon sx={{ fontSize: 14, color: palette.info.main }} />
            ) : null}
          </MenuItem>
        </Link>
      ))}
    </>
  );
}

export default SocialMenu;
