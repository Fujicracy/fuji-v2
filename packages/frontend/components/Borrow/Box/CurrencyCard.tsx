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
import { Currency } from '@x-fuji/sdk';
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
import {
  isNativeOrWrapped,
  nativeAndWrappedPair,
} from '../../../helpers/currencies';
import { BasePosition } from '../../../helpers/positions';
import {
  formatValue,
  toNotSoFixed,
  validAmount,
} from '../../../helpers/values';
import { useBorrow } from '../../../store/borrow.store';
import styles from '../../../styles/components/Borrow.module.css';
import Balance from '../../Shared/Balance';
import { CurrencyIcon } from '../../Shared/Icons';

type SelectCurrencyCardProps = {
  type: AssetType;
  actionType: ActionType;
  assetChange: AssetChange;
  isExecuting: boolean;
  disabled: boolean;
  value: string;
  showMax: boolean;
  maxAmount: number;
  onCurrencyChange: (currency: Currency) => void;
  onInputChange: (value: string) => void;
  ltvMeta: LtvMeta;
  basePosition: BasePosition;
  isEditing: boolean;
  isFocusedByDefault: boolean;
};

function CurrencyCard({
  type,
  showMax,
  assetChange,
  actionType,
  isExecuting,
  disabled,
  value,
  maxAmount,
  onCurrencyChange,
  onInputChange,
  ltvMeta,
  basePosition,
  isEditing,
  isFocusedByDefault,
}: SelectCurrencyCardProps) {
  const { palette } = useTheme();

  const { currency, usdPrice, balances, selectableCurrencies } = assetChange;
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);

  const balance = balances[currency.symbol];

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

  const shouldShowNativeWrappedPair =
    isEditing &&
    type === 'collateral' &&
    isNativeOrWrapped(currency, selectableCurrencies);

  const currencyList = shouldShowNativeWrappedPair
    ? nativeAndWrappedPair(selectableCurrencies)
    : selectableCurrencies;

  const handleRef = useCallback((node: HTMLInputElement) => {
    setTextInput(node);
  }, []);

  const handleMax = () => {
    // when we do max withdrawal, we have to deduct a small amount,
    // otherwise the tx can fail due to some unaccounted dust leftovers
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
    const value = validAmount(val, currency.decimals);
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

  const handleCurrencyChange = (currency: Currency) => {
    onCurrencyChange(currency);
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
          disabled={isExecuting || (disabled && !shouldShowNativeWrappedPair)}
          onClick={open}
        >
          {disabled && !shouldShowNativeWrappedPair ? (
            <>
              <CurrencyIcon currency={currency} height={24} width={24} />
              <Typography ml={1} variant="h6">
                {currency.symbol}
              </Typography>
            </>
          ) : (
            <CurrencyItem
              currency={currency}
              prepend={<KeyboardArrowDownIcon />}
              sx={{ borderRadius: '2rem' }}
            />
          )}
        </ButtonBase>
        <Menu
          id={`${type}-currency`}
          anchorEl={anchorEl}
          open={isOpen}
          onClose={close}
          TransitionComponent={Fade}
        >
          {currencyList.map((currency) => (
            <CurrencyItem
              key={currency.name}
              currency={currency}
              balance={balances[currency.symbol]}
              onClick={() => handleCurrencyChange(currency)}
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
                  {toNotSoFixed(recommended(), true)} {debt.currency.symbol}
                </Typography>
              </Typography>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

type CurrencyItem = {
  currency: Currency;
  balance?: number;
  prepend?: ReactElement;
  sx?: SxProps<Theme>;
  onClick?: (currency: Currency) => void;
};
const CurrencyItem = ({
  currency,
  balance,
  prepend,
  sx,
  onClick,
}: CurrencyItem) => {
  return (
    <MenuItem
      data-cy="currency-select"
      key={currency.name}
      value={currency.symbol}
      onClick={() => onClick && onClick(currency)}
      sx={sx}
    >
      <ListItemIcon>
        <CurrencyIcon currency={currency} height={24} width={24} />
      </ListItemIcon>
      <ListItemText>
        <Typography variant="h6">{currency.symbol}</Typography>
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

export default CurrencyCard;

CurrencyCard.defaultProps = {
  disabled: false,
};
