import { Box } from '@mui/material';
import { ChainId, Currency, VaultType } from '@x-fuji/sdk';
import React from 'react';

import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
} from '../../../../helpers/assets';
import { PositionData } from '../../../../helpers/positions';
import ChainSelect from './ChainSelect';
import CurrencyCard from './CurrencyCard';

type BorrowBoxProps = {
  isEditing: boolean;
  actionType: ActionType;
  type: AssetType;
  isExecuting: boolean;
  showMax: boolean;
  maxAmount: number;
  index: number;
  changeAssetChain: (
    type: AssetType,
    chainId: ChainId,
    updateVault: boolean,
    currency?: Currency
  ) => void;
  changeAssetCurrency: (
    type: AssetType,
    currency: Currency,
    updateVault: boolean
  ) => void;
  changeAssetValue: (type: AssetType, value: string) => void;
  assetChange?: AssetChange;
  value?: string;
  ltvMeta?: LtvMeta;
  chainId?: ChainId;
  positionData?: PositionData;
  vaultType?: VaultType;
};

function FormAssetBox({
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
  positionData,
  index,
  changeAssetChain,
  changeAssetCurrency,
  changeAssetValue,
  vaultType = VaultType.BORROW,
}: BorrowBoxProps) {
  const assetActionLabel =
    type === AssetType.Collateral
      ? actionType === ActionType.ADD
        ? vaultType === VaultType.LEND
          ? 'Deposit from'
          : 'Collateral from'
        : 'Withdraw to'
      : actionType === ActionType.ADD
      ? 'Borrow to'
      : 'Payback from';

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
        label={assetActionLabel}
        type={type}
        value={chainId}
        disabled={isExecuting}
        onChange={(chainId) => {
          changeAssetChain(
            type,
            chainId,
            vaultType === VaultType.BORROW && !isEditing,
            assetChange?.currency
          );
        }}
      />
      <CurrencyCard
        type={type}
        vaultType={vaultType}
        showMax={showMax}
        maxAmount={maxAmount}
        isEditing={isEditing}
        assetChange={assetChange}
        actionType={actionType}
        disabled={isEditing}
        isExecuting={isExecuting}
        value={value}
        ltvMeta={ltvMeta}
        positionData={positionData}
        isFocusedByDefault={index === 0}
        onCurrencyChange={(currency, updateVault) => {
          changeAssetCurrency(type, currency, updateVault);
        }}
        onInputChange={(value) => changeAssetValue(type, value)}
      />
    </Box>
  );
}

export default FormAssetBox;
