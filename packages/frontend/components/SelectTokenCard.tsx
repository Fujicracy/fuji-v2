import React from 'react'
import { Button, Card, TextField, Typography } from '@mui/material'

import CustomSelect from './Form/CustomSelect'
import styles from '../styles/components/Borrow.module.css'
import { colorTheme } from '../styles/theme'

declare interface SelectTokenCardProps {
  value: string
  onChangeValue: any // TODO: give a good type!
  token: string
  onChangeToken: any // TODO: give a good type!
  tokens: string[]
  type: 'collateral' | 'borrow'
}

export default function SelectTokenCard (props: SelectTokenCardProps) {
  return (
    <Card variant='outlined' sx={{width: '23rem'}}>
      <div
        className={styles.cardLine}
      >
        <TextField
          id='collateral-amount'
          type='number'
          placeholder='0'
          //label='amount'
          value={props.value}
          onChange={props.onChangeValue}
          sx={{
            fontSize: '1.125rem',
            boxShadow: 'none',
            '.MuiOutlinedInput-notchedOutline': { border: 0 }
          }}
        />
        <CustomSelect
          labelId='collateral-token-label'
          id='collateral-token'
          value={props.token}
          onSelect={props.onChangeToken}
          options={props.tokens}
          label={null}
          large={true}
        />
      </div>
      <div className={styles.cardLine}>
        {props.type === 'collateral' ? (
          <>
            <Typography variant='small'>~$2000.00</Typography>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Typography variant='xsmall' className={styles.maxBtn}>
                MAX
              </Typography>

              <Typography variant='small'>
                <span style={{ color: colorTheme.palette.info.dark }}>
                  Balance
                </span>
                : 2.88 ETH
              </Typography>
            </div>
          </>
        ) : (
          <>
            <Typography variant='small'>~$675.00</Typography>
            <div>
              <Typography variant='small'>
                <span style={{ color: colorTheme.palette.info.dark }}>
                  LTV 45% (Recommended): n/a
                </span>
                {/*:{' '}
                 <span style={{ color: colorTheme.palette.success.main }}>
                  900 USDC
                </span> */}
              </Typography>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
