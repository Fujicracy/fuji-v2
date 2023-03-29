import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  ButtonBase,
  Card,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  SxProps,
  TextField,
  Theme,
  Typography,
  useTheme,
} from '@mui/material';
import { Token } from '@x-fuji/sdk';
import React, { MouseEvent, ReactElement, useState } from 'react';

import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
  recommendedLTV,
} from '../../../helpers/assets';
import { formatValue } from '../../../helpers/values';
import styles from '../../../styles/components/Borrow.module.css';
import Balance from '../../Shared/Balance';
import { TokenIcon } from '../../Shared/Icons';

type SelectTokenCardProps = {
  type: AssetType;
  actionType: ActionType;
  assetChange: AssetChange;
  isExecuting: boolean;
  disabled: boolean;
  value: string;
  ltvMeta: LtvMeta;
  core: boolean;
  maxAmount?: number;
  onTokenChange: (token: Token) => void;
  onInputChange: (value: string) => void;
};

function TokenCard({
  type,
  core,
  assetChange,
  actionType,
  isExecuting,
  disabled,
  value,
  ltvMeta,
  maxAmount,
  onTokenChange,
  onInputChange,
}: SelectTokenCardProps) {
  const { palette } = useTheme();

  const { token, usdPrice, balances, selectableTokens } = assetChange;

  const balance = balances[token.symbol];

  const { ltv, ltvMax } = ltvMeta;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const close = () => setAnchorEl(null);

  const handleMax = () => {
    // const amount = type === "debt" ? 50 : balance
    handleInput(maxAmount?.toString() ?? '0');
  };

  const handleInput = (val: string) => {
    onInputChange(val);
  };

  const handleTokenChange = (token: Token) => {
    onTokenChange(token);
    close();
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor:
          (actionType === ActionType.ADD ? 'collateral' : 'debt') === type &&
          Number(assetChange.input) > balance
            ? palette.error.dark
            : palette.secondary.light,
      }}
    >
      <div className={styles.cardLine}>
        <TextField
          id="collateral-amount"
          type="number"
          placeholder="0"
          value={value}
          disabled={isExecuting}
          onChange={(e) => handleInput(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
        />
        <ButtonBase
          id={`select-${type}-button`}
          disabled={isExecuting || disabled}
          onClick={open}
        >
          {token && disabled ? (
            <>
              <TokenIcon token={token} height={24} width={24} />
              <Typography ml={1} variant="h6">
                {token.symbol}
              </Typography>
            </>
          ) : (
            <TokenItem
              token={token}
              prepend={<KeyboardArrowDownIcon />}
              sx={{ borderRadius: '2rem' }}
            />
          )}
        </ButtonBase>
        <Menu
          id={`${type}-token`}
          anchorEl={anchorEl}
          open={isOpen}
          onClose={close}
          TransitionComponent={Fade}
        >
          {selectableTokens.map((token) => (
            <TokenItem
              key={token.name}
              token={token}
              balance={balances[token.symbol]}
              onClick={() => handleTokenChange(token)}
            />
          ))}
        </Menu>
      </div>

      <div className={styles.cardLine} style={{ marginTop: '1rem' }}>
        {core ? (
          <>
            <Typography variant="small" sx={{ width: '11rem' }}>
              {formatValue(usdPrice * +value, { style: 'currency' })}
            </Typography>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="xsmall"
                align="center"
                className={styles.maxBtn}
                onClick={handleMax}
                data-cy="max-btn"
                mr="0.4rem"
              >
                MAX
              </Typography>

              <Typography variant="smallDark">Balance: </Typography>
              <Typography
                ml=".25rem"
                color={
                  +value > balance ? palette.error.dark : palette.text.primary
                }
              >
                <Balance balance={balance} dataCy="balance-amount" />
              </Typography>
            </div>
          </>
        ) : (
          <>
            <Typography
              variant="small"
              sx={{
                minWidth: '2.5rem',
                ['@media screen and (max-width: 370px)']: {
                  fontSize: '0.7rem',
                },
              }}
            >
              {`$${formatValue(usdPrice * +value)}`}
            </Typography>

            <Stack direction="row">
              <Typography
                variant="smallDark"
                color={
                  !ltv
                    ? ''
                    : ltv > ltvMax
                    ? palette.error.main
                    : ltv > recommendedLTV(ltvMax)
                    ? palette.warning.main
                    : palette.success.main
                }
                mr=".5rem"
                sx={{
                  ['@media screen and (max-width: 370px)']: {
                    fontSize: '0.7rem',
                  },
                }}
              >
                LTV {ltv <= 100 && ltv >= 0 ? `${ltv.toFixed(0)}%` : 'n/a'}
              </Typography>
              <Typography
                variant="smallDark"
                sx={{
                  '&::before': {
                    content: '"Recommended: "',
                  },
                  ['@media screen and (max-width: 370px)']: {
                    fontSize: '0.7rem',
                  },
                  ['@media screen and (max-width: 320px)']: {
                    '&::before': {
                      content: '"Rec. "',
                    },
                  },
                }}
              >
                ({recommendedLTV(ltvMax)}%)
              </Typography>
            </Stack>
          </>
        )}
      </div>
    </Card>
  );
}

type TokenItem = {
  token: Token;
  balance?: number;
  prepend?: ReactElement;
  sx?: SxProps<Theme>;
  onClick?: (token: Token) => void;
};
const TokenItem = (props: TokenItem) => {
  const { token, balance, prepend, sx, onClick } = props;
  return (
    <MenuItem
      key={token.name}
      value={token.symbol}
      onClick={() => onClick && onClick(token)}
      sx={sx}
    >
      <ListItemIcon>
        <TokenIcon token={token} height={24} width={24} />
      </ListItemIcon>
      <ListItemText>
        <Typography variant="h6">{token.symbol}</Typography>
      </ListItemText>
      {typeof balance === 'number' && (
        <Typography variant="smallDark" ml="3rem">
          <Balance balance={balance} />
        </Typography>
      )}
      {prepend}
    </MenuItem>
  );
};

export default TokenCard;

TokenCard.defaultProps = {
  disabled: false,
};
