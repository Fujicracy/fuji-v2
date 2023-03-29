import { Box } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';

import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
} from '../../../helpers/assets';
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
  ltvMeta: LtvMeta;
  assetChange: AssetChange;
  core: boolean;
  maxAmount?: number;
};

function BorrowBox({
  isEditing,
  actionType,
  assetChange,
  type,
  chainId,
  isExecuting,
  value,
  ltvMeta,
  core,
  maxAmount,
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
        disabled={(isEditing && type === 'debt') || isExecuting}
        showTooltip={isEditing && type === 'debt'}
        onChange={(chainId) =>
          type === 'collateral'
            ? changeCollateralChain(chainId, !isEditing)
            : changeDebtChain(chainId, !isEditing)
        }
      />
      <TokenCard
        type={type}
        core={core}
        maxAmount={maxAmount}
        assetChange={assetChange}
        actionType={actionType}
        disabled={isEditing}
        isExecuting={isExecuting}
        value={value}
        ltvMeta={ltvMeta}
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
