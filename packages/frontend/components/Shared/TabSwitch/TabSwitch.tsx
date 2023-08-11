import { Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { TabOption } from '../../../constants';
import Chip from './Chip';

type TabSwitchProps = {
  options: TabOption[];
  selected: number | number[];
  onChange: (value: number) => void;
  size?: 'large' | 'default';
  width?: string;
  withBackground?: boolean;
};

function TabSwitch({
  options,
  selected,
  onChange,
  withBackground = false,
  size = 'default',
  width = 'auto',
}: TabSwitchProps) {
  const { palette } = useTheme();

  const isSelected = (index: number) => {
    if (typeof selected === 'number') {
      return selected === index;
    }

    return selected.includes(index);
  };

  return (
    <Stack
      direction="row"
      sx={{
        flexWrap: 'wrap',
        gap: '0.2rem',
        p: '0.1875rem',
        minHeight: size === 'large' ? '2.75rem' : '2.5rem',
        backgroundColor: withBackground
          ? palette.secondary.contrastText
          : 'transparent',
        borderRadius: '0.75rem',
        border: `1px solid ${alpha(palette.secondary.light, 0.5)}`,
        width,
      }}
    >
      {options.map((p, index) => (
        <Chip
          key={index}
          selected={isSelected(p.value)}
          label={p.label}
          onClick={() => {
            onChange(p.value);
          }}
          size={size}
        />
      ))}
    </Stack>
  );
}

export default TabSwitch;
