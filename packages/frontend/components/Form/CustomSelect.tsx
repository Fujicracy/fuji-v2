import React from 'react'
import { FormControl, MenuItem, Select, Typography } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Image from 'next/image'

import { chains } from '../../machines/auth.machine'
import styles from '../../styles/components/Borrow.module.css'

type Chain = typeof chains[0]

declare interface CustomSelectProps {
  labelId: string
  id: string
  onSelect: any // TODO: give a good type!
  value: string | number
  options: Chain[] | string[]
  label: string | null
  large: boolean | null
}

export default function CustomSelect (props: CustomSelectProps) {
  return (
    <FormControl>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label id={props.labelId} className={styles.selectLabel}>
          {props.label}
        </label>
        <Select
          labelId={props.labelId}
          id={props.id}
          value={props.value}
          onChange={props.onSelect}
          IconComponent={KeyboardArrowDownIcon}
          sx={{
            marginBottom: '1rem',
            boxShadow: 'none',
            '.MuiOutlinedInput-notchedOutline': { border: 0 }
          }}
          variant='standard'
          disableUnderline
        >
          {props.options.map((option: Chain | string) => (
            <MenuItem
              key={typeof option === 'string' ? option : option.id}
              value={typeof option === 'string' ? option : option.id}
            >
              <div style={{ display: 'flex' }}>
                <Image
                  src={`/assets/images/protocol-icons/${
                    typeof option === 'string' ? 'tokens' : 'networks'
                  }/${typeof option === 'string' ? option : option.label}.svg`}
                  height={props.large ? 24 : 18}
                  width={props.large ? 24 : 18}
                  alt={typeof option === 'string' ? option : option.label}
                />
                <span style={{ marginLeft: '0.5rem' }}>
                  <Typography variant={props.large ? 'h6' : 'small'}>
                    {typeof option === 'string' ? option : option.label}
                    {typeof option === 'string' ? '' : ' Network'}
                  </Typography>
                </span>
              </div>
            </MenuItem>
          ))}
        </Select>
      </div>
    </FormControl>
  )
}
