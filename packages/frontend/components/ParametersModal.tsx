import React, { useEffect, useRef } from 'react'
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Switch
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import Image from 'next/image'

import { colorTheme } from '../styles/theme'

type ParametersModalProps = {
  onClickOutside: () => void
}

export default function ParametersModal (props: ParametersModalProps) {
  const ref: any = useRef(null)

  useEffect(() => {
    document.addEventListener(
      'click',
      (event: Event) => {
        if (ref.current && !ref.current.contains(event.target)) {
          props.onClickOutside && props.onClickOutside()
        }
      },
      true
    )
  }, [props.onClickOutside, props])

  return (
    <Box
      ref={ref}
      sx={{
        background: colorTheme.palette.secondary.main,
        borderRadius: '0.75rem',
        border: `0.063rem solid ${colorTheme.palette.secondary.light}`,
        padding: '0.5rem',
        position: 'absolute',
        top: '4.5rem',
        right: '0.125rem',
        color: colorTheme.palette.text.secondary
      }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary='Mode' />
            <Switch icon={<DarkModeIcon />} checkedIcon={<LightModeIcon />} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <a
          href='https://discord.com/invite/dnvJeEMeDJ'
          target='_blank'
          rel='noreferrer'
        >
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary='Help' />
              <Image
                src='/assets/images/logo/socials/discord.svg'
                alt='Discord'
                width={16}
                height={16}
              />
            </ListItemButton>
          </ListItem>
        </a>
        <a
          href='https://discord.com/invite/dnvJeEMeDJ'
          target='_blank'
          rel='noreferrer'
        >
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary='Feedback' />
              <Image
                src='/assets/images/logo/socials/discord.svg'
                alt='Discord'
                width={16}
                height={16}
              />
            </ListItemButton>
          </ListItem>
        </a>
        <a
          href='https://twitter.com/FujiFinance'
          target='_blank'
          rel='noreferrer'
        >
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary='@FujiFinance' />
              <Image
                src='/assets/images/logo/socials/twitter.svg'
                alt='Twitter'
                width={16}
                height={16}
              />
            </ListItemButton>
          </ListItem>
        </a>
        <a
          href='https://t.me/joinchat/U4cKWNCUevKVsrtY'
          target='_blank'
          rel='noreferrer'
        >
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary='Message on Telegram' />
              <Image
                src='/assets/images/logo/socials/telegram.svg'
                alt='Telegram'
                width={16}
                height={16}
              />
            </ListItemButton>
          </ListItem>
        </a>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary='Redeem Receipt Tokens' />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary='Token Allowances' />
          </ListItemButton>
        </ListItem>
        <a href='https://docs.fujidao.org/' target='_blank' rel='noreferrer'>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary='Docs' />
            </ListItemButton>
          </ListItem>
        </a>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary='Blog' />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary='Careers' />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary='Roadmap' />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )
}
