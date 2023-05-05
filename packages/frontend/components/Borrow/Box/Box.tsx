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
import TokenCard from './TokenCard';

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
  const changeCollateralToken = useBorrow(
    (state) => state.changeCollateralToken
  );
  const changeCollateralValue = useBorrow(
    (state) => state.changeCollateralValue
  );
  const changeDebtChain = useBorrow((state) => state.changeDebtChain);
  const changeDebtToken = useBorrow((state) => state.changeDebtToken);
  const changeDebtValue = useBorrow((state) => state.changeDebtValue);

  return (
    <Box
      mb={
        (isEditing && actionType === ActionType.REMOVE
          ? 'debt'
          : 'collateral') === type
          ? '1rem'
          : undefined
      }
    >
      <ChainSelect
        label={
          type === 'collateral'
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
          type === 'collateral'
            ? changeCollateralChain(chainId, !isEditing)
            : changeDebtChain(chainId, !isEditing)
        }
      />
      <TokenCard
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
        onTokenChange={(token) =>
          type === 'collateral'
            ? changeCollateralToken(token)
            : changeDebtToken(token)
        }
        onInputChange={(value) =>
          type === 'collateral'
            ? changeCollateralValue(value)
            : changeDebtValue(value)
        }
      />
    </Box>
  );
}

export default BorrowBox;
