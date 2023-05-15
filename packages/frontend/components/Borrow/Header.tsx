import { Box, Divider, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { ActionType } from '../../helpers/assets';
import { wrappedSymbol } from '../../helpers/currencies';
import { useBorrow } from '../../store/borrow.store';
import { CurrencyIcon, NetworkIcon } from '../Shared/Icons';
import SlippageSettings from '../Shared/SlippageSettings';
import TabChip from '../Shared/TabChip';
import { TooltipWrapper } from '../Shared/Tooltips';

type BorrowHeaderProps = {
  isEditing: boolean;
  actionType: ActionType;
  chainName: string;
  onActionTypeChange: (action: ActionType) => void;
  isCrossChainOperation: boolean;
};

function BorrowHeader({
  isEditing,
  actionType,
  chainName,
  onActionTypeChange,
  isCrossChainOperation,
}: BorrowHeaderProps) {
  const { palette } = useTheme();
  const networkMessage = `Your position is currently on the ${chainName} Network`;
  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);

  return (
    <>
      {isEditing ? (
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
            {isCrossChainOperation && (
              <Box sx={{ ml: '1rem' }}>
                <SlippageSettings />
              </Box>
            )}
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
          {isCrossChainOperation && <SlippageSettings />}
        </Stack>
      )}
      <Divider sx={{ mt: '1rem', mb: '0.5rem' }} />
      {isEditing && (
        <Stack
          direction="row"
          sx={{
            marginTop: 3,
            marginBottom: 3,
            flexWrap: 'wrap',
            gap: '0.25rem',
            p: '0.1875rem',
            height: '2.875rem',
            backgroundColor: palette.secondary.dark,
            borderRadius: '0.75rem',
            border: `1px solid ${alpha(palette.secondary.light, 0.5)}`,
          }}
        >
          {[ActionType.ADD, ActionType.REMOVE].map((p) => (
            <TabChip
              key={`${p}`}
              selected={actionType === p}
              label={
                p === ActionType.ADD
                  ? 'Deposit / Borrow'
                  : 'Payback / Withdraw '
              }
              onClick={() => {
                onActionTypeChange(p);
              }}
            />
          ))}
        </Stack>
      )}
    </>
  );
}

export default BorrowHeader;
