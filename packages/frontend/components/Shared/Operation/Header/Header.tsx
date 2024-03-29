import { Box, Divider, Stack, Typography } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';

import { TabOption } from '../../../../constants';
import { ActionType, AssetChange } from '../../../../helpers/assets';
import { wrappedSymbol } from '../../../../helpers/currencies';
import { CurrencyIcon } from '../../Icons';
import TabSwitch from '../../TabSwitch/TabSwitch';
import HeaderInfo from './Info';

type OperationHeaderProps = {
  type: VaultType;
  isEditing: boolean;
  actionType: ActionType;
  chainName: string;
  onActionTypeChange: (action: ActionType) => void;
  isCrossChainOperation: boolean;
  collateral: AssetChange;
  debt?: AssetChange;
};

function OperationHeader({
  type,
  isEditing,
  actionType,
  chainName,
  onActionTypeChange,
  isCrossChainOperation,
  collateral,
  debt,
}: OperationHeaderProps) {
  const actionOptions: TabOption[] = [
    {
      value: ActionType.ADD,
      label: type === VaultType.BORROW ? 'Deposit / Borrow' : 'Deposit',
    },
    {
      value: ActionType.REMOVE,
      label: type === VaultType.BORROW ? 'Withdraw / Payback' : 'Withdraw',
    },
  ];
  const networkMessage = `Your position is currently on the ${chainName} Network`;

  const borrowingHeader = (debt: AssetChange) => {
    return (
      <Stack direction="row" justifyContent="start" alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <CurrencyIcon currency={debt.currency} height={40} width={40} />
          <CurrencyIcon
            currency={collateral.currency}
            height={16}
            width={16}
            sx={{
              position: 'absolute',
              right: 0,
              transform: 'translateY(-100%)',
            }}
          />
        </Box>
        <Box ml="0.75rem">
          <Typography variant="h5" fontSize="1.25rem" lineHeight="150%">
            Debt: {debt.currency.symbol}
          </Typography>
          <Typography variant="small" fontSize="0.875rem" lineHeight="22.4px">
            Collateral: {wrappedSymbol(collateral.currency)}
          </Typography>
        </Box>
      </Stack>
    );
  };

  const lendingHeader = () => {
    return (
      <Stack direction="row" justifyContent="start" alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <CurrencyIcon currency={collateral.currency} height={40} width={40} />
        </Box>
        <Box ml="0.75rem">
          <Typography variant="h5" fontSize="1.25rem" lineHeight="150%">
            Supply: {collateral.currency.symbol}
          </Typography>
        </Box>
      </Stack>
    );
  };

  return (
    <>
      {isEditing ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="60px"
        >
          {debt ? borrowingHeader(debt) : lendingHeader()}
          <HeaderInfo
            isEditing={isEditing}
            isCrossChainOperation={isCrossChainOperation}
            chainName={chainName}
            tooltipMessage={networkMessage}
            defaultOpen={true}
          />
        </Stack>
      ) : (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="40px"
        >
          <Typography variant="body2" height="40px" lineHeight="40px">
            {type === VaultType.BORROW ? 'Borrow' : 'Lend'}
          </Typography>
          <HeaderInfo
            isEditing={isEditing}
            isCrossChainOperation={isCrossChainOperation}
            chainName={chainName}
            tooltipMessage="The network where you deposit to and borrow from"
          />
        </Stack>
      )}
      <Divider sx={{ m: '0.5rem 0' }} />
      {isEditing && (
        <Box mt={3} mb={3}>
          <TabSwitch
            size="large"
            options={actionOptions}
            selected={actionType}
            onChange={onActionTypeChange}
          />
        </Box>
      )}
    </>
  );
}

export default OperationHeader;
