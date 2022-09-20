import React from 'react'
import { chains } from '../../machines/auth.machine'
import { FormControl, Icon, InputLabel, MenuItem, Select } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Image from 'next/image'

type Chain = typeof chains[0]

declare interface CustomSelectProps {
  labelId: string
  id: string
  onSelect: any // TODO: give a good type!
  value: string | number
  options: Chain[] | string[]
  label: string | null
}

export default function CustomSelect (props: CustomSelectProps) {
  return (
    <FormControl>
      {props.label !== null && (
        <InputLabel id={props.labelId}>{props.label}</InputLabel>
      )}
      <Select
        labelId={props.labelId}
        id={props.id}
        value={props.value}
        onChange={props.onSelect}
        IconComponent={KeyboardArrowDownIcon}
      >
        {props.options.map((option: Chain | string) => (
          <MenuItem
            key={typeof option === 'string' ? option : option.id}
            value={typeof option === 'string' ? option : option.id}
          >
            {/* <Icon>
              <Image
                src={`../../public/assets/images/protocol-icons/tokens/${
                  typeof option === 'string' ? option : option.label
                }.svg`}
                height={18}
                width={18}
                alt={typeof option === 'string' ? option : option.label}
              />
            </Icon> */}
            {typeof option === 'string' ? option : option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
