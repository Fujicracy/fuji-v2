import React from 'react'
import {
  Box,
  Divider,
  LinearProgress,
  Tooltip,
  Typography
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { colorTheme } from '../styles/theme'

declare interface LTVProgressBarProps {
  borrowLimit: number
  value: number
}

export default function LTVProgressBar (props: LTVProgressBarProps) {
  return (
    <Box>
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: '36%',
            color: colorTheme.palette.text.primary
          }}
        >
          <Tooltip title='???' placement='top'>
            <InfoOutlinedIcon
              sx={{ marginRight: '0.313rem', fontSize: '0.875rem' }}
            />
          </Tooltip>
          <Typography variant='xsmall'>45% LTV (Recommended)</Typography>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: colorTheme.palette.text.primary,
            marginLeft: '25%'
          }}
        >
          <Typography variant='xsmall'>75% LTV (MAX)</Typography>
          <Tooltip title='???' placement='top'>
            <InfoOutlinedIcon
              sx={{ marginLeft: '0.313rem', fontSize: '0.875rem' }}
            />
          </Tooltip>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <Divider
          sx={{
            height: '0.813rem',
            borderRight: `0.063rem solid ${colorTheme.palette.text.primary}`,
            borderBottom: 0,
            width: '60%',
            margin: 0
          }}
        />
        <Divider
          sx={{
            height: '0.813rem',
            borderRight: `0.063rem solid ${colorTheme.palette.text.primary}`,
            borderBottom: 0,
            width: '40%',
            margin: 0
          }}
        />
      </div>
      <LinearProgress
        sx={{
          borderRadius: '1.25rem',
          background: colorTheme.palette.secondary.main,
          height: '0.5rem',
          marginBottom: '0.5rem',
          color: 'red',
          '.css-uu0lzf-MuiLinearProgress-bar1': {
            background:
              props.value <= 45
                ? colorTheme.palette.success.main
                : colorTheme.palette.warning.main,
            borderRadius: '1.25rem'
          }
        }}
        value={props.value > 75 ? props.value : (props.value * 100) / 75}
        variant='determinate'
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: colorTheme.palette.text.primary
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='xsmall'>LTV</Typography>
          <Tooltip title='???'>
            <InfoOutlinedIcon
              sx={{ marginLeft: '0.313rem', fontSize: '0.875rem' }}
            />
          </Tooltip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title='???'>
            <InfoOutlinedIcon
              sx={{ marginRight: '0.313rem', fontSize: '0.875rem' }}
            />
          </Tooltip>
          <Typography variant='xsmall'>
            Borrow Limit: ${props.borrowLimit.toFixed(2)}
          </Typography>
        </div>
      </div>
    </Box>
  )
}
