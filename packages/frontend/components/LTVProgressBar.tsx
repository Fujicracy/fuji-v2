import React from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  Typography
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

declare interface LTVProgressBarProps {
  borrowLimit: number
  value: number
}

export default function LTVProgressBar (props: LTVProgressBarProps) {
  const theme = useTheme()

  return (
    <Box>
      <Grid container sx={{ marginLeft: '3rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: 'auto'
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
            marginRight: "3rem"
          }}
        >
          <Typography variant='xsmall'>75% LTV (MAX)</Typography>
          <Tooltip title='???' placement='top'>
            <InfoOutlinedIcon
              sx={{ marginLeft: '0.313rem', fontSize: '0.875rem' }}
            />
          </Tooltip>
        </div>
      </Grid>

      <Grid container>
        <Divider
          sx={{
            height: '0.813rem',
            borderRight: `0.063rem solid`,
            borderBottom: 0,
            width: '60%',
            margin: 0
          }}
        />
        <Divider
          sx={{
            height: '0.813rem',
            borderRight: `0.063rem solid`,
            borderBottom: 0,
            width: '40%',
            margin: 0
          }}
        />
      </Grid>
      <LinearProgress
        sx={{
          borderRadius: '1.25rem',
          background: theme.palette.background.default,
          height: '0.5rem',
          marginBottom: '0.5rem',
          '.css-uu0lzf-MuiLinearProgress-bar1': {
            background:
              props.value <= 45
                ? theme.palette.success.main
                : theme.palette.warning.main,
            borderRadius: '1.25rem'
          }
        }}
        value={props.value > 75 ? props.value : (props.value * 100) / 75}
        variant='determinate'
      />

      <Grid container justifyContent='space-between'>
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
      </Grid>
    </Box>
  )
}
