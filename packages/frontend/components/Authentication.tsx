import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { Box, Grid, Typography } from '@mui/material'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import CloseIcon from '@mui/icons-material/Close'

import ChainSelect from './Form/ChainSelect'
import ParametersModal from './ParametersModal'

export default function Authentication () {
  const theme = useTheme()
  const [showParametersModal, setShowParametersModal] = useState(false)

  const balance = 4.23
  const address = '0x6BV8...8974'

  return (
    <>
      <Grid container columnGap='0.5rem' justifyContent='flex-end'>
        <ChainSelect />

        <Box display='grid' gridTemplateColumns='1fr' sx={{ ml: '5rem' }}>
          <Box
            gridColumn={1}
            gridRow={1}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4rem',
              height: '2.25rem',
              padding: '0.438rem 0.75rem',
              marginLeft: '-5rem'
            }}
          >
            <Typography align='center' variant='small'>
              {balance} ETH
            </Typography>
          </Box>
          <Box
            gridColumn={1}
            gridRow={1}
            sx={{
              background: theme.palette.secondary.light,
              borderRadius: '4rem',
              height: '2.25rem',
              padding: '0.438rem 0.75rem'
            }}
          >
            <Typography align='center' variant='small'>
              {address}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            background: theme.palette.secondary.dark,
            borderRadius: '6.25rem',
            height: '2.25rem',
            padding: '0.438rem 0.75rem',
            cursor: 'pointer'
          }}
          onClick={() => setShowParametersModal(!showParametersModal)}
        >
          <Typography align='center' variant='small'>
            {showParametersModal ? <CloseIcon /> : <MoreHorizIcon />}
          </Typography>
        </Box>
      </Grid>
      {showParametersModal && (
        <ParametersModal onClickOutside={() => setShowParametersModal(false)} />
      )}
    </>
  )
}
