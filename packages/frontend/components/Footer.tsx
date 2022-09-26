import React, { useState } from 'react'
import { Box, Typography } from '@mui/material'
import Image from 'next/image'

import styles from '../styles/components/Footer.module.css'
import { colorTheme } from '../styles/theme'

declare interface Social {
  id: string
  url: string
  image: string
  imageHover: string
  alt: string
}

const socials: Social[] = [
  {
    id: 'twitter',
    url: 'https://twitter.com/FujiFinance',
    image: '/assets/images/logo/socials/twitter.svg',
    imageHover: '/assets/images/logo/socials/twitter_hover.svg',
    alt: 'twitter'
  },
  {
    id: 'discord',
    url: 'https://discord.com/invite/dnvJeEMeDJ',
    image: '/assets/images/logo/socials/discord.svg',
    imageHover: '/assets/images/logo/socials/discord_hover.svg',
    alt: 'discord'
  },
  {
    id: 'telegram',
    url: 'https://t.me/joinchat/U4cKWNCUevKVsrtY',
    image: '/assets/images/logo/socials/telegram.svg',
    imageHover: '/assets/images/logo/socials/telegram_hover.svg',
    alt: 'telegram'
  }
]

function Footer () {
  return (
    <footer
      style={{
        textAlign: 'center',
        width: '100%',
        bottom: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          margin: '1.5rem'
        }}
      >
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-around'
          }}
        >
          {socials.map((social: Social) => (
            <a
              href={social.url}
              target='_blank'
              key={social.id}
              rel='noreferrer'
            >
              <Logo social={social} />
            </a>
          ))}
        </Box>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: colorTheme.palette.text.secondary
          }}
        >
          <Typography variant='xsmall' className={styles.labels}>
            <a href='/about' target='_blank' className={styles.labelLink}>
              About
            </a>
            <a
              href='https://docs.fujidao.org'
              target='_blank'
              className={styles.labelLink}
              rel='noreferrer'
            >
              Documentation
            </a>
            © FujiDAO {new Date().getFullYear()}
          </Typography>
        </div>
      </div>
    </footer>
  )
}

declare interface LogoProps {
  social: Social
}

const Logo = (props: LogoProps) => {
  const [isHovering, setIsHovered] = useState(false)
  const onMouseEnter = () => setIsHovered(true)
  const onMouseLeave = () => setIsHovered(false)
  return (
    <Box mx={'0.5rem'}>
      <Image
        src={isHovering ? props.social.imageHover : props.social.image}
        alt={props.social.alt}
        width={16}
        height={16}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </Box>
  )
}

export default Footer
