import { Box } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import React from 'react';

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
  const changeAssetChain = useBorrow((state) => state.changeAssetChain);
  const changeAssetCurrency = useBorrow((state) => state.changeAssetCurrency);
  const changeAssetValue = useBorrow((state) => state.changeAssetValue);

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
          changeAssetChain(type, chainId, !isEditing, assetChange.currency)
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
        onCurrencyChange={(currency, updateVault) => {
          changeAssetCurrency(type, currency, updateVault);
        }}
        onInputChange={(value) => changeAssetValue(type, value)}
      />
    </Box>
  );
}

export default BorrowBox;
