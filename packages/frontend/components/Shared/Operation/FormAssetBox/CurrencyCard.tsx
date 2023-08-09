import { keyframes } from '@emotion/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  ButtonBase,
  Card,
  Fade,
  Menu,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Currency, VaultType } from '@x-fuji/sdk';
import React, { MouseEvent, useCallback, useEffect, useState } from 'react';

import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
  Mode,
  recommendedLTV,
  withdrawMaxAmount,
} from '../../../../helpers/assets';
import {
  isNativeAndWrappedPair,
  isNativeOrWrapped,
  nativeAndWrappedPair,
} from '../../../../helpers/currencies';
import { PositionData } from '../../../../helpers/positions';
import {
  formatAssetWithSymbol,
  formatValue,
  validAmount,
} from '../../../../helpers/values';
import { useBorrow } from '../../../../store/borrow.store';
import { useLend } from '../../../../store/lend.store';
import styles from '../../../../styles/components/Borrow.module.css';
import Balance from '../../Balance';
import { CurrencyIcon } from '../../Icons';
import CurrencyItem from './CurrencyItem';

type SelectCurrencyCardProps = {
  type: AssetType;
  actionType: ActionType;
  assetChange: AssetChange | undefined;
  isExecuting: boolean;
  disabled: boolean;
  value: string;
  showMax: boolean;
  maxAmount: number;
  onCurrencyChange: (currency: Currency, updateVault: boolean) => void;
  onInputChange: (value: string) => void;
  ltvMeta: LtvMeta | undefined;
  positionData: PositionData | undefined;
  isEditing: boolean;
  isFocusedByDefault: boolean;
  vaultType?: VaultType;
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
  positionData,
  isEditing,
  isFocusedByDefault,
  vaultType = VaultType.BORROW,
}: SelectCurrencyCardProps) {
  const { palette } = useTheme();

  const { currency, usdPrice, balances, selectableCurrencies } = assetChange
    ? assetChange
    : {
        currency: undefined,
        usdPrice: undefined,
        balances: undefined,
        selectableCurrencies: undefined,
      };
  const useStore = vaultType === VaultType.LEND ? useLend : useBorrow;
  const collateral = useStore().collateral;
  const debt = useBorrow((state) => state.debt);
  const [textInput, setTextInput] = useState<HTMLInputElement | undefined>(
    undefined
  );
  const [focused, setFocused] = useState<boolean>(false);
  const [calculatingMax, setCalculatingMax] = useState<boolean>(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleRef = useCallback((node: HTMLInputElement) => {
    setTextInput(node);
  }, []);

  useEffect(() => {
    if (isFocusedByDefault) {
      textInput?.focus();
    }
  }, [isFocusedByDefault, textInput]);

  const balance = balances ? balances[currency.symbol] : 0;

  const isOpen = Boolean(anchorEl);
  const open = (event: MouseEvent<HTMLElement>) => {
    if (currencyList.length === 0) return;
    setAnchorEl(event.currentTarget);
  };
  const close = () => setAnchorEl(null);

  const shouldShowNativeWrappedPair =
    currency &&
    isEditing &&
    type === AssetType.Collateral &&
    isNativeOrWrapped(currency, selectableCurrencies);

  const currencyList =
    shouldShowNativeWrappedPair && selectableCurrencies
      ? nativeAndWrappedPair(selectableCurrencies)
      : selectableCurrencies || [];

  const handleMax = async () => {
    if (calculatingMax) return;
    setCalculatingMax(true);
    let maxCollateralAmount = maxAmount;
    if (
      actionType === ActionType.REMOVE &&
      type === AssetType.Collateral &&
      positionData &&
      debt &&
      vaultType === VaultType.BORROW
    ) {
      // `mode` has to be precalculated because we set it based on inputs,
      // the mode will be set after the end of this function.
      const precalculatedMode =
        debt.input !== '' ? Mode.PAYBACK_AND_WITHDRAW : Mode.WITHDRAW;
      const result = await withdrawMaxAmount(
        precalculatedMode,
        positionData,
        debt,
        collateral
      );
      if (result.success) {
        maxCollateralAmount = result.data;
      }
    }
    setCalculatingMax(false);
    handleInput(String(maxCollateralAmount));
  };

  const handleInput = (val: string) => {
    if (!currency) return;
    const value = validAmount(val, currency.decimals);
    onInputChange(value);
  };

  const recommended = (): string => {
    if (
      !ltvMeta ||
      !positionData ||
      (ltvMeta.ltv > recommendedLTV(ltvMeta.ltvMax) && !value) ||
      (!ltvMeta.ltv && collateral.amount && !collateral.input)
    ) {
      return '0';
    }

    const collateralValue = isEditing
      ? positionData.editedPosition
        ? positionData.editedPosition.collateral.amount
        : positionData.position.collateral.amount
      : Number(collateral.input);

    const recommended =
      (recommendedLTV(ltvMeta.ltvMax) * collateralValue * collateral.usdPrice) /
        100 -
      (isEditing && positionData.position.type === VaultType.BORROW
        ? positionData.position.debt.amount
        : 0);

    return String(recommended);
  };

  const handleRecommended = () => {
    if (!ltvMeta || Math.round(ltvMeta.ltv) === recommendedLTV(ltvMeta.ltvMax))
      return;

    handleInput(recommended());
  };

  const handleCurrencyChange = (currency: Currency) => {
    const currentCurrency =
      type === AssetType.Collateral ? collateral.currency : debt?.currency;

    const updateVault =
      currentCurrency !== undefined &&
      !isEditing &&
      !isNativeAndWrappedPair(currency, currentCurrency);
    onCurrencyChange(currency, updateVault);
    close();
  };

  const blink = keyframes`
    from {
      visibility: visible;
    }
    to {
      visibility: hidden;
    }
  `;

  const usdValue =
    usdPrice && !isNaN(usdPrice * +value)
      ? formatValue(usdPrice * +value, { style: 'currency' })
      : '$0.00';

  return (
    <Card
      data-cy="borrow-input"
      variant="outlined"
      sx={{
        borderColor:
          (actionType === ActionType.ADD
            ? AssetType.Collateral
            : AssetType.Debt) === type &&
          Number(assetChange?.input || '') > balance
            ? palette.error.dark
            : focused
            ? palette.info.main
            : palette.secondary.light,
      }}
    >
      <div className={styles.cardLine}>
        <TextField
          id={`${type}-amount`}
          type="number"
          inputProps={{ step: '0.1', lang: 'en-US' }}
          placeholder="0"
          inputRef={handleRef}
          value={value}
          disabled={isExecuting || (type === AssetType.Debt && !debt)}
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
        {currency && (
          <ButtonBase
            id={`select-${type}-button`}
            disabled={isExecuting || (disabled && !shouldShowNativeWrappedPair)}
            onClick={open}
          >
            {disabled && !shouldShowNativeWrappedPair && currency ? (
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
        )}

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
              balance={balances ? balances[currency.symbol] : 0}
              onClick={() => handleCurrencyChange(currency)}
            />
          ))}
        </Menu>
      </div>

      <div className={styles.cardLine} style={{ marginTop: '1rem' }}>
        {showMax ? (
          <>
            <Typography variant="small" sx={{ width: '8rem' }}>
              ~{usdValue}
            </Typography>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                data-cy="recommended-btn"
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
                  data-cy="recommended-value"
                  variant="smallDark"
                  color={palette.success.main}
                  sx={{
                    cursor: 'pointer',
                  }}
                >
                  {formatAssetWithSymbol({
                    amount: recommended(),
                    symbol: debt?.currency.symbol,
                  })}
                </Typography>
              </Typography>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default CurrencyCard;

CurrencyCard.defaultProps = {
  disabled: false,
  value: '',
};
