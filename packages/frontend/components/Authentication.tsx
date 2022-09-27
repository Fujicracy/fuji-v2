import React from 'react'
import { Box, Typography } from '@mui/material'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'

import { colorTheme } from '../styles/theme'
import NetworkSelect from './Form/NetworkSelect'

export default function Authentication () {
  const balance = 4.23
  const address = '0x6BV8...8974'

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <NetworkSelect />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', marginLeft: "5rem", }}>
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4rem',
            height: '2.25rem',
            padding: '0.438rem 0.75rem',
            marginLeft: "-5rem",
            gridRowStart: 1,
            gridColumnStart: 1,
          }}
        >
          <Typography
            sx={{ textAlign: 'center', color: colorTheme.palette.text.primary }}
            variant='small'
          >
            {balance} ETH
          </Typography>
        </Box>
        <Box
          sx={{
            background: colorTheme.palette.secondary.light,
            borderRadius: '4rem',
            height: '2.25rem',
            padding: '0.438rem 0.75rem',
            gridRowStart: 1,
            gridColumnStart: 1,
          }}
        >
          <Typography
            sx={{ textAlign: 'center', color: colorTheme.palette.text.primary }}
            variant='small'
          >
            {address}
          </Typography>
        </Box>
      </div>
      <Box
        sx={{
          background: colorTheme.palette.secondary.dark,
          borderRadius: '6.25rem',
          height: '2.25rem',
          padding: '0.438rem 0.75rem'
        }}
      >
        <Typography
          sx={{ textAlign: 'center', color: colorTheme.palette.text.primary }}
          variant='small'
        >
          <MoreHorizIcon sx={{ color: colorTheme.palette.text.secondary }} />
        </Typography>
      </Box>
    </div>
  )
}
