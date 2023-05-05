import { keyframes } from '@emotion/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  ButtonBase,
  Card,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SxProps,
  TextField,
  Theme,
  Typography,
  useTheme,
} from '@mui/material';
import { Token } from '@x-fuji/sdk';
import React, {
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { DUST_AMOUNT } from '../../../constants';
import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
  recommendedLTV,
} from '../../../helpers/assets';
import { BasePosition } from '../../../helpers/positions';
import {
  formatValue,
  toNotSoFixed,
  validAmount,
} from '../../../helpers/values';
import { useBorrow } from '../../../store/borrow.store';
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
  showMax: boolean;
  maxAmount: number;
  onTokenChange: (token: Token) => void;
  onInputChange: (value: string) => void;
  ltvMeta: LtvMeta;
  basePosition: BasePosition;
  isEditing: boolean;
  isFocusedByDefault: boolean;
};

function TokenCard({
  type,
  showMax,
  assetChange,
  actionType,
  isExecuting,
  disabled,
  value,
  maxAmount,
  onTokenChange,
  onInputChange,
  ltvMeta,
  basePosition,
  isEditing,
  isFocusedByDefault,
}: SelectTokenCardProps) {
  const { palette } = useTheme();

  const { token, usdPrice, balances, selectableTokens } = assetChange;
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);

  const balance = balances[token.symbol];

  const { ltv, ltvMax } = ltvMeta;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);
  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const close = () => setAnchorEl(null);

  const [textInput, setTextInput] = useState<HTMLInputElement | undefined>(
    undefined
  );
  const [focused, setFocused] = useState<boolean>(false);

  const handleRef = useCallback((node: HTMLInputElement) => {
    setTextInput(node);
  }, []);

  const handleMax = () => {
    // when we do max withdrawal, we have to deduct a small amount,
    // otherwise the tx can fail due to some unaccounted dust lefovers
    const deductedCollateral = Math.max(
      0,
      basePosition.position.collateral.amount - DUST_AMOUNT / 100
    );
    const amount =
      actionType === ActionType.REMOVE && type === 'collateral'
        ? deductedCollateral -
          (basePosition.position.debt.amount - Number(debt.input)) /
            ((ltvMax > 1 ? ltvMax / 100 : ltvMax) * collateral.usdPrice)
        : maxAmount;
    handleInput(String(amount));
  };

  const handleInput = (val: string) => {
    const value = validAmount(val, token.decimals);
    onInputChange(value);
  };

  const recommended = (): string => {
    if (
      (ltv > recommendedLTV(ltvMax) && !value) ||
      (!ltv && collateral.amount && !collateral.input)
    ) {
      return '0';
    }

    const collateralValue = isEditing
      ? basePosition.editedPosition
        ? basePosition.editedPosition.collateral.amount
        : basePosition.position.collateral.amount
      : Number(collateral.input);

    const recommended =
      (recommendedLTV(ltvMax) * collateralValue * collateral.usdPrice) / 100 -
      (isEditing ? basePosition.position.debt.amount : 0);

    return String(recommended);
  };

  const handleRecommended = () => {
    if (Math.round(ltv) === recommendedLTV(ltvMax)) return;

    handleInput(recommended());
  };

  const handleTokenChange = (token: Token) => {
    onTokenChange(token);
    close();
  };

  useEffect(() => {
    if (isFocusedByDefault) {
      textInput?.focus();
    }
  }, [isFocusedByDefault, textInput]);

  const blink = keyframes`
    from {
      visibility: visible;
    }
    to {
      visibility: hidden;
    }
  `;

  const usdValue = isNaN(usdPrice * +value)
    ? '$0'
    : formatValue(usdPrice * +value, { style: 'currency' });

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor:
          (actionType === ActionType.ADD ? 'collateral' : 'debt') === type &&
          Number(assetChange.input) > balance
            ? palette.error.dark
            : focused
            ? palette.info.main
            : palette.secondary.light,
      }}
    >
      <div className={styles.cardLine}>
        <TextField
          id="collateral-amount"
          type="number"
          inputProps={{ step: '0.1', lang: 'en-US' }}
          placeholder="0"
          inputRef={handleRef}
          value={value}
          disabled={isExecuting}
          onChange={(e) => handleInput(e.target.value)}
          variant="standard"
          InputProps={{
            disableUnderline: true,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={{
            '&.MuiInputBase-input:focus': {
              caretColor: 'auto',
              animation: `${blink} 1s infinite`,
            },
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
        {showMax ? (
          <>
            <Typography variant="small" sx={{ width: '11rem' }}>
              ~{usdValue}
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
              }}
            >
              ~{usdValue}
            </Typography>

            {Number(recommended()) > 0 && (
              <Typography
                variant="smallDark"
                sx={{
                  cursor: 'pointer',
                  '&::before': {
                    content: '"Recommended: "',
                  },
                  ['@media screen and (max-width: 370px)']: {
                    '&::before': {
                      content: '"Rec. "',
                    },
                  },
                }}
                onClick={handleRecommended}
              >
                <Typography
                  variant="smallDark"
                  color={palette.success.main}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  {toNotSoFixed(recommended(), true)} {debt.token.symbol}
                </Typography>
              </Typography>
            )}
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
