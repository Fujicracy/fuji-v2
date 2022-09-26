import React from 'react'
import { Card, Typography } from '@mui/material'

import { colorTheme } from '../styles/theme'

declare interface CurrencyCardProps {
  informations: {title: string, amount: string, footer: string}
}

export default function CurrencyCard (props: CurrencyCardProps) {
  return (
    <Card
      sx={{
        borderRadius: '0.5rem',
        backgroundColor: colorTheme.palette.secondary.dark,
        padding: '1.5rem',
        display: 'block',
        marginBottom: '1rem'
      }}
    >
      <Typography
        variant='small'
        sx={{ color: colorTheme.palette.info.dark, fontWeight: 500 }}
      >
        {props.informations.title}
      </Typography>

      <Typography
        variant='h4'
        sx={{
          color: colorTheme.palette.text.primary,
          fontWeight: 600,
          marginBottom: '1rem'
        }}
      >
        {props.informations.amount}
      </Typography>

      <Typography variant='small' sx={{ color: colorTheme.palette.info.dark }}>
        {props.informations.footer}
      </Typography>
    </Card>
  )
}
