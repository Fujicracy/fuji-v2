import React from "react"
import {
  Fade,
  Link,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Typography,
  useTheme,
} from "@mui/material"
import Chip from "@mui/material/Chip"
import TwitterIcon from "@mui/icons-material/Twitter"
import CloseIcon from "@mui/icons-material/Close"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import { DiscordIcon } from "./DiscordIcon"

export default function Parameters() {
  const { palette } = useTheme()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget)
  }

  const closeMenu = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Chip
        label={isOpen ? <CloseIcon /> : <MoreHorizIcon />}
        onClick={openMenu}
      />
      <Menu
        id="paramters-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 1 }}
        TransitionComponent={Fade}
      >
        <MenuList sx={{ minWidth: "200px" }}>
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
        </MenuList>
      </Menu>
    </>
  )
}
