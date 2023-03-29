import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Fade,
  Grid,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { ChainId } from '@x-fuji/sdk';

import { AssetType } from '../../../helpers/assets';
import { chains } from '../../../helpers/chains';
import { NetworkIcon } from '../../Shared/Icons';

type ChainSelectProps = {
  label: string;
  type: AssetType;
  value: ChainId;
  showTooltip: boolean;
  disabled: boolean;
  onChange: (chainId: ChainId) => void;
};
const ChainSelect = ({
  value,
  label,
  type,
  disabled,
  showTooltip,
  onChange,
}: ChainSelectProps) => {
  const labelId = `${type}-label`;
  const selectId = `${type}-chain-select`;
  const menuId = `${type}-chain-menu`;

  return (
    <Stack alignItems="center" direction="row" mb="1rem">
      <Typography id={labelId} variant="smallDark">
        {label}
      </Typography>
      <Select
        labelId={labelId}
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as ChainId)}
        IconComponent={KeyboardArrowDownIcon}
        variant="standard"
        disableUnderline
        MenuProps={{ TransitionComponent: Fade, id: menuId }}
      >
        {chains.map((chain) => {
          return (
            <MenuItem key={chain.chainId} value={chain.chainId}>
              <Grid container alignItems="center">
                <NetworkIcon network={chain.name} height={18} width={18} />
                <span style={{ marginLeft: '0.5rem' }}>
                  <Typography variant="small">{chain.name}</Typography>
                </span>
              </Grid>
            </MenuItem>
          );
        })}
      </Select>
      {showTooltip && (
        <Tooltip title="{Placeholder}" placement="top">
          <InfoOutlinedIcon
            sx={{
              ml: '0.1rem',
              fontSize: '0.875rem',
              display: { xs: 'none', sm: 'inline' },
            }}
          />
        </Tooltip>
      )}
    </Stack>
  );
};

export default ChainSelect;

ChainSelect.defaultProps = {
  showTooltip: false,
  disabled: false,
};
