import React, { useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Divider,
  Link,
  ListItemText,
  MenuItem,
  MenuList,
  Switch
} from '@mui/material'
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { DiscordIcon } from './DiscordIcon'

type ParametersModalProps = {
  onClickOutside: () => void
}

export default function ParametersModal (props: ParametersModalProps) {
  const theme = useTheme()
  const ref: any = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target)) {
        props.onClickOutside && props.onClickOutside()
      }
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [props.onClickOutside, props])

  return (
    <Box
      ref={ref}
      sx={{
        background: theme.palette.background.default,
        borderRadius: '0.75rem',
        border: `0.063rem solid ${theme.palette.secondary.light}`,
        position: 'absolute',
        top: '4.5rem',
        right: '0.125rem',
        color: theme.palette.text.secondary
      }}
    >
      <MenuList>
        <MenuItem>
          <ListItemText>Mode</ListItemText>
          <Switch icon={<DarkModeIcon />} checkedIcon={<LightModeIcon />} />
        </MenuItem>
        <Divider />
        <Link
          href='https://discord.com/invite/dnvJeEMeDJ'
          target='_blank'
          rel='noreferrer'
        >
          <MenuItem>
            <ListItemText>Help</ListItemText>
            <DiscordIcon />
          </MenuItem>
        </Link>
        <Link
          href='https://discord.com/invite/dnvJeEMeDJ'
          target='_blank'
          rel='noreferrer'
        >
          <MenuItem>
            <ListItemText>Feedback</ListItemText>
            <DiscordIcon />
          </MenuItem>
        </Link>
        <Link
          href='https://twitter.com/FujiFinance'
          target='_blank'
          rel='noreferrer'
        >
          <MenuItem>
            <ListItemText>@FujiFinance</ListItemText>
            <TwitterIcon />
          </MenuItem>
        </Link>
        <Link
          href='https://t.me/joinchat/U4cKWNCUevKVsrtY'
          target='_blank'
          rel='noreferrer'
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
        <Link href='https://docs.fujidao.org/' target='_blank' rel='noreferrer'>
          <MenuItem>
            <ListItemText>Docs</ListItemText>
          </MenuItem>
        </Link>
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
    </Box>
  )
}
