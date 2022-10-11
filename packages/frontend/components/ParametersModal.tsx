import React from "react"
import {
  Divider,
  Link,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Switch,
} from "@mui/material"
import Chip from "@mui/material/Chip"
import TwitterIcon from "@mui/icons-material/Twitter"
import TelegramIcon from "@mui/icons-material/Telegram"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import LightModeIcon from "@mui/icons-material/LightMode"
import CloseIcon from "@mui/icons-material/Close"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import { DiscordIcon } from "./DiscordIcon"
import { useStore } from "../store"

export default function ParametersModal() {
  const logout = useStore((state) => state.logout)
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
        id="basic-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuList>
          <MenuItem>
            <ListItemText>Mode</ListItemText>
            <Switch icon={<DarkModeIcon />} checkedIcon={<LightModeIcon />} />
          </MenuItem>
          <Divider />
          <Link
            href="https://discord.com/invite/dnvJeEMeDJ"
            target="_blank"
            rel="noreferrer"
          >
            <MenuItem>
              <ListItemText>Help</ListItemText>
              <DiscordIcon />
            </MenuItem>
          </Link>
          <Link
            href="https://discord.com/invite/dnvJeEMeDJ"
            target="_blank"
            rel="noreferrer"
          >
            <MenuItem>
              <ListItemText>Feedback</ListItemText>
              <DiscordIcon />
            </MenuItem>
          </Link>
          <Link
            href="https://twitter.com/FujiFinance"
            target="_blank"
            rel="noreferrer"
          >
            <MenuItem>
              <ListItemText>@FujiFinance</ListItemText>
              <TwitterIcon />
            </MenuItem>
          </Link>
          <Link
            href="https://t.me/joinchat/U4cKWNCUevKVsrtY"
            target="_blank"
            rel="noreferrer"
          >
            <MenuItem>
              <ListItemText>Telegram</ListItemText>
              <TelegramIcon />
            </MenuItem>
          </Link>
          <Divider />
          <MenuItem>
            <ListItemText>Redeem Receipt Tokens</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemText>Token Allowances</ListItemText>
          </MenuItem>
          <MenuItem>
            <Link
              href="https://docs.fujidao.org/"
              target="_blank"
              rel="noreferrer"
            >
              <ListItemText>Docs</ListItemText>
            </Link>
          </MenuItem>
          <MenuItem>
            <ListItemText>Blog</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemText>Careers</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemText>Roadmap</ListItemText>
          </MenuItem>
        </MenuList>
        <Divider />
        <MenuItem onClick={() => logout()}>
          <ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
