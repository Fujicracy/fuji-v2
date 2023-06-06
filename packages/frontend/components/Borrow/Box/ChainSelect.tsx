import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Fade, Grid, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Chain, ChainId } from '@x-fuji/sdk';

import { AssetType } from '../../../helpers/assets';
import { chains } from '../../../helpers/chains';
import { NetworkIcon } from '../../Shared/Icons';

type ChainSelectProps = {
  label: string;
  type: AssetType;
  disabled: boolean;
  onChange: (chainId: ChainId) => void;
  value?: ChainId | undefined;
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
  value?: ChainId;
  disabled: boolean;
  labelId: string;
  onChange: (chainId: ChainId) => void;
}) {
  const selectId = `${type}-chain-select`;
  const menuId = `${type}-chain-menu`;

  const renderItem = (chain: Chain) => (
    <Grid container alignItems="center">
      <NetworkIcon network={chain.name} height={18} width={18} />
      <span style={{ marginLeft: '0.5rem' }}>
        <Typography variant="small">{chain.name}</Typography>
      </span>
    </Grid>
  );

  return (
    <Select
      data-cy="borrow-chain-select"
      labelId={labelId}
      id={selectId}
      value={value || ''}
      displayEmpty={true}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ChainId)}
      IconComponent={KeyboardArrowDownIcon}
      variant="standard"
      renderValue={(chainId) => {
        const chain = chains.find((c) => c.chainId === chainId);
        if (!chain) {
          return <Typography>Select a network</Typography>;
        }
        return renderItem(chain);
      }}
      disableUnderline
      MenuProps={{ TransitionComponent: Fade, id: menuId }}
    >
      {chains.map((chain) => {
        return (
          <MenuItem
            data-cy="borrow-chain-select-item"
            key={chain.chainId}
            value={chain.chainId}
          >
            {renderItem(chain)}
          </MenuItem>
        );
      })}
    </Select>
  );
}
