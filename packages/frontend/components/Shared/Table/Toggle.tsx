import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { IconButton } from '@mui/material';
import { MouseEvent } from 'react';

type ToggleProps = {
  expandRow: boolean;
  isVisible: boolean;
  onClick: (e: MouseEvent) => void;
};

function Toggle(props: ToggleProps) {
  const { expandRow, isVisible, onClick } = props;

  const visibility = isVisible ? 'visible' : 'hidden';

  return (
    <IconButton
      onClick={onClick}
      size="small"
      sx={{ visibility }}
      data-cy="market-toggle"
    >
      {expandRow ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
    </IconButton>
  );
}

export default Toggle;
