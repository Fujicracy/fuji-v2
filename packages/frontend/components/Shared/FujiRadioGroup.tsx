import { Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio, { RadioProps } from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import { ReactNode } from 'react';

const FujiIcon = styled('span')(({ theme }) => ({
  borderRadius: '50%',
  border: '1px solid #47494C',
  width: 16,
  height: 16,
  backgroundColor: 'transparent',
  backgroundImage:
    'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))',
  '.Mui-focusVisible &': {
    outline: '2px auto rgba(19,124,189,.6)',
    outlineOffset: 2,
  },
  'input:hover ~ &': {
    backgroundColor: '#27272E',
  },
  'input:disabled ~ &': {
    boxShadow: 'none',
    background: theme.palette.text.disabled,
  },
}));

const FujiCheckedIcon = styled(FujiIcon)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  backgroundImage:
    'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
  border: 'none',
  '&:before': {
    display: 'block',
    width: 16,
    height: 16,
    backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)',
    content: '""',
  },
  'input:hover ~ &': {
    backgroundColor: theme.palette.primary.light,
  },
}));

function FujiRadio(props: RadioProps) {
  return (
    <Radio
      disableRipple
      color="default"
      checkedIcon={<FujiCheckedIcon />}
      icon={<FujiIcon />}
      {...props}
    />
  );
}

function FujiRadioGroup({
  label,
  values,
}: {
  label: string;
  values: Array<{ value: string | number; label: string | ReactNode }>;
}) {
  return (
    <FormControl>
      <FormLabel id={`${label}-radios`}>
        <Typography variant="small">{label}</Typography>
      </FormLabel>
      <RadioGroup
        defaultValue={values[0].value}
        aria-labelledby={`${label}-radios`}
        name={`${label}-radios`}
      >
        {values.map((radio, i) => (
          <FormControlLabel
            key={i}
            value={radio.value}
            control={<FujiRadio />}
            label={radio.label}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

export default FujiRadioGroup;
