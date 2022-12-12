import React from "react"
import {
  Link,
  ListItemText,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material"
import TwitterIcon from "@mui/icons-material/Twitter"
import { DiscordIcon } from "./DiscordIcon"

export default function ParameterLinks() {
  const { palette } = useTheme()

  return (
    <>
      <Link
        href="https://discord.com/invite/dnvJeEMeDJ"
        target="_blank"
        rel="noreferrer"
      >
        <MenuItem>
          <ListItemText>
            <Typography color={palette.info.main} variant="small">
              Help
            </Typography>
          </ListItemText>
          <DiscordIcon size={14} color={palette.info.main} />
        </MenuItem>
      </Link>
      <Link
        href="https://discord.com/invite/dnvJeEMeDJ"
        target="_blank"
        rel="noreferrer"
      >
        <MenuItem>
          <ListItemText>
            <Typography color={palette.info.main} variant="small">
              Feedback
            </Typography>
          </ListItemText>
          <DiscordIcon size={14} color={palette.info.main} />
        </MenuItem>
      </Link>
      <Link
        href="https://twitter.com/FujiFinance"
        target="_blank"
        rel="noreferrer"
      >
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
  )
}
