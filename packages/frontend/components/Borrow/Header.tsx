import { Box, Divider, Stack, Typography } from '@mui/material';

import { TabOption } from '../../constants';
import { ActionType } from '../../helpers/assets';
import { wrappedSymbol } from '../../helpers/currencies';
import { useBorrow } from '../../store/borrow.store';
import { CurrencyIcon, NetworkIcon } from '../Shared/Icons';
import TabSwitch from '../Shared/TabSwitch/TabSwitch';
import { TooltipWrapper } from '../Shared/Tooltips';
import SlippageSettings from './SlippageSettings';

type BorrowHeaderProps = {
  isEditing: boolean;
  actionType: ActionType;
  chainName: string;
  onActionTypeChange: (action: ActionType) => void;
  isCrossChainOperation: boolean;
};

const actionOptions: TabOption[] = [
  { value: ActionType.ADD, label: 'Deposit / Borrow' },
  { value: ActionType.REMOVE, label: 'Withdraw / Payback' },
];

function BorrowHeader({
  isEditing,
  actionType,
  chainName,
  onActionTypeChange,
  isCrossChainOperation,
}: BorrowHeaderProps) {
  const networkMessage = `Your position is currently on the ${chainName} Network`;
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);

  return (
    <>
      {isEditing && debt ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="40px"
        >
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
              <Typography
                variant="small"
                fontSize="0.875rem"
                lineHeight="22.4px"
              >
                Collateral: {wrappedSymbol(collateral.currency)}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="40px"
          >
            {isCrossChainOperation && (
              <Box sx={{ mr: '1rem' }}>
                <SlippageSettings />
              </Box>
            )}
            <TooltipWrapper
              defaultOpen
              placement="top"
              title={
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '10rem',
                  }}
                >
                  <Typography variant="small">{networkMessage}</Typography>
                </Box>
              }
            >
              <NetworkIcon network={chainName} height={18} width={18} />
            </TooltipWrapper>
          </Stack>
        </Stack>
      ) : (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="40px"
        >
          <Typography variant="body2" height="40px" lineHeight="40px">
            Borrow
          </Typography>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="40px"
          >
            {isCrossChainOperation && (
              <Box sx={{ mr: '1rem' }}>
                <SlippageSettings />
              </Box>
            )}
            <NetworkIcon network={chainName} height={18} width={18} />
          </Stack>
        </Stack>
      )}
      <Divider sx={{ mt: '1rem', mb: '0.5rem' }} />
      {isEditing && (
        <TabSwitch
          size="large"
          options={actionOptions}
          selected={actionType}
          onChange={onActionTypeChange}
        />
      )}
    </>
  );
}

export default BorrowHeader;
