import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Collapse,
  Container,
  Divider,
  Tooltip,
  Typography
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import CurrencyCard from './CurrencyCard'
import LTVProgressBar from './LTVProgressBar'
import { colorTheme } from '../styles/theme'

export default function Overview () {
  const [showAaveDetails, setShowAaveDetails] = useState(false)

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
        <CardContent sx={{ width: '100%', padding: 0 }}>
          <Typography
            variant='body2'
            sx={{ color: colorTheme.palette.text.primary }}
          >
            Overview
          </Typography>
          <Divider sx={{ mt: '1rem', mb: '1.5rem' }} />

          <div style={{ display: 'flex', gap: '1rem' }}>
            <CurrencyCard
              informations={{
                title: 'Collateral Provided',
                amount: '0 ETH',
                footer: '0.00 USD'
              }}
            />
            <CurrencyCard
              informations={{
                title: 'Borrowed Value',
                amount: '$0.00',
                footer: '0.00 USDC'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <CurrencyCard
              informations={{
                title: 'Liquidation Price',
                amount: '$0.00',
                footer: 'n/a'
              }}
            />
            <CurrencyCard
              informations={{
                title: 'Current Price',
                amount: '$2000.00',
                footer: 'ETH'
              }}
            />
          </div>

          <Divider sx={{ mt: 1.5, mb: 1.5 }} />

          <LTVProgressBar borrowLimit={0} value={45} />

          <Divider sx={{ mt: 1.5, mb: 2.5 }} />

          <Typography
            variant='body2'
            sx={{ color: colorTheme.palette.text.primary }}
          >
            Details
          </Typography>

          <br />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              variant='small'
              sx={{ color: colorTheme.palette.info.dark }}
            >
              Current Loan-to-Value
            </Typography>

            <Typography
              variant='small'
              sx={{ color: colorTheme.palette.text.primary }}
            >
              45%
            </Typography>
          </div>

          <Divider sx={{ mt: 1.5, mb: 2.5 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              variant='small'
              sx={{ color: colorTheme.palette.info.dark }}
            >
              LTV liquidation threshold
            </Typography>

            <Typography
              variant='small'
              sx={{ color: colorTheme.palette.text.primary }}
            >
              75%
            </Typography>
          </div>

          <Divider sx={{ mt: 1.5, mb: 2.5 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant='small'
                sx={{ color: colorTheme.palette.info.dark }}
              >
                Borrow Interest (APR)
              </Typography>
              <Tooltip title='???'>
                <InfoOutlinedIcon
                  sx={{ marginLeft: '0.625rem', fontSize: '0.875rem' }}
                />
              </Tooltip>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setShowAaveDetails(!showAaveDetails)}
              >
                <Typography
                  variant='small'
                  sx={{ color: colorTheme.palette.text.primary }}
                >
                  Aave:{' '}
                  <span style={{ color: colorTheme.palette.success.main }}>
                    1.83%
                  </span>
                  <Divider
                    sx={{
                      marginLeft: '0.531rem',
                      marginRight: '0.25rem',
                      borderRight: `0.063rem solid ${colorTheme.palette.text.secondary}`,
                      borderBottom: 0,
                      display: 'inline'
                    }}
                  />
                </Typography>
                {showAaveDetails ? (
                  <CancelIcon
                    sx={{
                      marginLeft: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: colorTheme.palette.text.secondary
                    }}
                  />
                ) : (
                  <AddCircleIcon
                    sx={{
                      marginLeft: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: colorTheme.palette.text.secondary
                    }}
                  />
                )}
              </div>
              <Collapse in={showAaveDetails} sx={{ mt: '0.25rem' }}>
                <Typography
                  variant='small'
                  sx={{
                    color: colorTheme.palette.info.dark,
                    display: 'flex',
                    justifyContent: 'space-between',
                    ':hover': {
                      color: colorTheme.palette.text.primary
                    }
                  }}
                >
                  <span>DForce:</span>
                  <span>3.33%</span>
                </Typography>
              </Collapse>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
