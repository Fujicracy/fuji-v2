import { Box, Divider, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { ActionType } from '../../helpers/assets';
import { useBorrow } from '../../store/borrow.store';
import { NetworkIcon } from '../Shared/Icons';
import { TokenIcon } from '../Shared/Icons';
import SlippageSettings from '../Shared/SlippageSettings';
import TabSwitch from '../Shared/TabSwitch';
import TooltipWrapper from '../Shared/Tooltips/TooltipWrapper';

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
              <TokenIcon token={debt.token} height={40} width={40} />
              <TokenIcon
                token={collateral.token}
                height={16}
                width={16}
                sx={{
                  position: 'absolute',
                  botton: 0,
                  right: 0,
                  transform: 'translateY(-100%)',
                }}
              />
            </Box>
            <Box ml="0.75rem">
              <Typography variant="h5" fontSize="1.25rem" lineHeight="150%">
                Debt: {debt.token.symbol}
              </Typography>
              <Typography
                variant="small"
                fontSize="0.875rem"
                lineHeight="22.4px"
              >
                Collateral: {collateral.token.symbol}
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
        <TabSwitch
          size="large"
          actions={[
            { value: ActionType.ADD, label: 'Deposit / Borrow' },
            { value: ActionType.REMOVE, label: 'Withdraw / Payback' },
          ]}
          selected={actionType}
          onChange={onActionTypeChange}
        />
      )}
    </>
  );
}

export default BorrowHeader;
