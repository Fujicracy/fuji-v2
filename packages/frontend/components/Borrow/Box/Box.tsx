import { Box } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';

import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
} from '../../../helpers/assets';
import { BasePosition } from '../../../helpers/positions';
import { useBorrow } from '../../../store/borrow.store';
import ChainSelect from './ChainSelect';
import CurrencyCard from './CurrencyCard';

type BorrowBoxProps = {
  isEditing: boolean;
  actionType: ActionType;
  type: AssetType;
  chainId: ChainId;
  isExecuting: boolean;
  value: string;
  assetChange: AssetChange;
  showMax: boolean;
  maxAmount: number;
  ltvMeta: LtvMeta;
  basePosition: BasePosition;
  index: number;
};

function BorrowBox({
  isEditing,
  actionType,
  assetChange,
  type,
  chainId,
  isExecuting,
  value,
  showMax,
  maxAmount,
  ltvMeta,
  basePosition,
  index,
}: BorrowBoxProps) {
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  );
  const changeCollateralCurrency = useBorrow(
    (state) => state.changeCollateralCurrency
  );
  const changeCollateralValue = useBorrow(
    (state) => state.changeCollateralValue
  );
  const changeDebtChain = useBorrow((state) => state.changeDebtChain);
  const changeDebtCurrency = useBorrow((state) => state.changeDebtCurrency);
  const changeDebtValue = useBorrow((state) => state.changeDebtValue);

  return (
    <Box
      mb={
        (isEditing && actionType === ActionType.REMOVE
          ? AssetType.Debt
          : AssetType.Collateral) === type
          ? '1rem'
          : undefined
      }
    >
      <ChainSelect
        label={
          type === AssetType.Collateral
            ? actionType === ActionType.ADD
              ? 'Collateral from'
              : 'Withdraw to'
            : actionType === ActionType.ADD
            ? 'Borrow to'
            : 'Payback from'
        }
        type={type}
        value={chainId}
        disabled={isExecuting}
        onChange={(chainId) =>
          type === AssetType.Collateral
            ? changeCollateralChain(
                chainId,
                !isEditing,
                assetChange.currency.symbol
              )
            : changeDebtChain(chainId, !isEditing, assetChange.currency.symbol)
        }
      />
      <CurrencyCard
        type={type}
        showMax={showMax}
        maxAmount={maxAmount}
        isEditing={isEditing}
        assetChange={assetChange}
        actionType={actionType}
        disabled={isEditing}
        isExecuting={isExecuting}
        value={value}
        ltvMeta={ltvMeta}
        basePosition={basePosition}
        isFocusedByDefault={index === 0}
        onCurrencyChange={(currency) =>
          type === AssetType.Collateral
            ? changeCollateralCurrency(currency)
            : changeDebtCurrency(currency)
        }
        onInputChange={(value) =>
          type === AssetType.Collateral
            ? changeCollateralValue(value)
            : changeDebtValue(value)
        }
      />
    </Box>
  );
}

export default BorrowBox;
