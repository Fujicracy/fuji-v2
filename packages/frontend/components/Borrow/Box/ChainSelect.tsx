import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Fade, Grid, MenuItem, Select, Stack, Typography } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';

import { AssetType } from '../../../helpers/assets';
import { chains } from '../../../helpers/chains';
import { NetworkIcon } from '../../Shared/Icons';

type ChainSelectProps = {
  label: string;
  type: AssetType;
  value: ChainId;
  disabled: boolean;
  onChange: (chainId: ChainId) => void;
};
const ChainSelect = ({
  value,
  label,
  type,
  disabled,
  onChange,
}: ChainSelectProps) => {
  const labelId = `${type}-label`;

  return (
    <Stack alignItems="center" direction="row" mb="1rem">
      <Typography id={labelId} variant="smallDark">
        {label}
      </Typography>
      <ChainSelectContent
        type={type}
        value={value}
        disabled={disabled}
        labelId={labelId}
        onChange={onChange}
      />
    </Stack>
  );
};

export default ChainSelect;

ChainSelect.defaultProps = {
  showTooltip: false,
  disabled: false,
};

function ChainSelectContent({
  type,
  value,
  disabled,
  labelId,
  onChange,
}: {
  type: AssetType;
  value: ChainId;
  disabled: boolean;
  labelId: string;
  onChange: (chainId: ChainId) => void;
}) {
  const selectId = `${type}-chain-select`;
  const menuId = `${type}-chain-menu`;
  return (
    <Select
      data-cy="borrow-chain-select"
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
          <MenuItem
            key={chain.chainId}
            value={chain.chainId}
            data-cy="borrow-chain-select-item"
          >
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
  );
}
