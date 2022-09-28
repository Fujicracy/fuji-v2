import React, { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Card,
  CardContent,
  Collapse,
  Container,
  Divider,
  Grid,
  Tooltip,
  Typography
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import CurrencyCard from './CurrencyCard'
import LTVProgressBar from './LTVProgressBar'

export default function Overview () {
  const theme = useTheme()
  const [showProvider, setShowProvider] = useState(false)

  return (
    <Container>
      <p>
        Current state: <code>...</code>
      </p>
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1.5rem 2rem'
        }}
      >
        <CardContent sx={{ width: '100%', padding: 0, gap: '1rem' }}>
          <Typography variant='body2'>Overview</Typography>
          <Divider sx={{ mt: '1rem', mb: '1.5rem' }} />

          <Grid container rowSpacing='1rem' columnSpacing='1rem'>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: 'Collateral Provided',
                  amount: '0 ETH',
                  footer: '0.00 USD'
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: 'Borrowed Value',
                  amount: '$0.00',
                  footer: '0.00 USDC'
                }}
              />
            </Grid>

            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: 'Liquidation Price',
                  amount: '$0.00',
                  footer: 'n/a'
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <CurrencyCard
                informations={{
                  title: 'Current Price',
                  amount: '$2000.00',
                  footer: 'ETH'
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mt: 1.5, mb: 1.5 }} />

          <LTVProgressBar borrowLimit={0} value={45} />

          <Divider sx={{ mt: 1.5, mb: 2.5 }} />

          <Typography variant='body2'>Details</Typography>

          <br />

          <Grid container justifyContent='space-between'>
            <Typography variant='smallDark'>Current Loan-to-Value</Typography>

            <Typography variant='small'>45%</Typography>
          </Grid>

          <Divider sx={{ mt: 1.5, mb: 2.5 }} />

          <Grid container justifyContent='space-between'>
            <Typography variant='smallDark'>
              LTV liquidation threshold
            </Typography>

            <Typography variant='small'>75%</Typography>
          </Grid>

          <Divider sx={{ mt: 1.5, mb: 2.5 }} />

          <Grid container justifyContent='space-between'>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='smallDark'>Borrow Interest (APR)</Typography>
              <Tooltip title='???'>
                <InfoOutlinedIcon
                  sx={{ marginLeft: '0.625rem', fontSize: '0.875rem' }}
                />
              </Tooltip>
            </div>
            <Box>
              <Box
                sx={{ alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowProvider(!showProvider)}
              >
                <Typography variant='small'>
                  Aave:{' '}
                  <span style={{ color: theme.palette.success.main }}>
                    1.83%
                  </span>
                  <Divider
                    sx={{
                      marginLeft: '0.531rem',
                      marginRight: '0.25rem',
                      borderRight: `0.063rem solid ${theme.palette.text.secondary}`,
                      borderBottom: 0,
                      display: 'inline'
                    }}
                  />
                </Typography>
                {showProvider ? (
                  <CancelIcon
                    sx={{
                      marginLeft: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  />
                ) : (
                  <AddCircleIcon
                    sx={{
                      marginLeft: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  />
                )}
              </Box>
              <Collapse in={showProvider} sx={{ mt: '0.25rem' }}>
                <Typography
                  variant='smallDark'
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    ':hover': {
                      color: theme.palette.text.primary
                    }
                  }}
                >
                  <span>DForce:</span>
                  <span>3.33%</span>
                </Typography>
              </Collapse>
            </Box>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}
