import { Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { TabOption } from '../../../constants';
import TabChip from './TabChip';

type TabSwitchProps = {
  options: TabOption[];
  selected: number;
  onChange: (value: number) => void;
  size?: 'large' | 'default';
  width?: string;
};

function TabSwitch({
  options,
  selected,
  onChange,
  size = 'default',
  width = 'auto',
}: TabSwitchProps) {
  const { palette } = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        marginTop: 3,
        marginBottom: 3,
        flexWrap: 'wrap',
        gap: '0.2rem',
        p: '0.1875rem',
        height: size === 'large' ? '2.875rem' : '2.5rem',
        backgroundColor:
          size === 'large' ? palette.secondary.dark : 'transparent',
        borderRadius: '0.75rem',
        border: `1px solid ${alpha(palette.secondary.light, 0.5)}`,
        width,
      }}
    >
      {options.map((p) => (
        <TabChip
          key={`${p.label}`}
          selected={selected === p.value}
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
