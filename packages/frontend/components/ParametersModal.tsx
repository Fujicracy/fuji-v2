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
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import Image from 'next/image'

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
        padding: '0.5rem',
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
            <Image
              src='/assets/images/logo/socials/discord.svg'
              alt='Discord'
              width={16}
              height={16}
            />
          </MenuItem>
        </Link>
        <Link
          href='https://discord.com/invite/dnvJeEMeDJ'
          target='_blank'
          rel='noreferrer'
        >
          <MenuItem>
            <ListItemText>Feedback</ListItemText>
            <Image
              src='/assets/images/logo/socials/discord.svg'
              alt='Discord'
              width={16}
              height={16}
            />
          </MenuItem>
        </Link>
        <Link
          href='https://twitter.com/FujiFinance'
          target='_blank'
          rel='noreferrer'
        >
          <MenuItem>
            <ListItemText>@FujiFinance</ListItemText>
            <Image
              src='/assets/images/logo/socials/twitter.svg'
              alt='Twitter'
              width={16}
              height={16}
            />
          </MenuItem>
        </Link>
        <Link
          href='https://t.me/joinchat/U4cKWNCUevKVsrtY'
          target='_blank'
          rel='noreferrer'
        >
          <MenuItem>
            <ListItemText>Message on Telegram</ListItemText>
            <Image
              src='/assets/images/logo/socials/telegram.svg'
              alt='Telegram'
              width={16}
              height={16}
            />
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
