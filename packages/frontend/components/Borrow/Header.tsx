import { Box, Divider, Stack, Typography } from '@mui/material';

import { ActionType } from '../../helpers/assets';
import { NetworkIcon } from '../Shared/Icons';
import SlippageSettings from '../Shared/SlippageSettings';
import TabChip from '../Shared/TabChip';
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
  const networkMessage = `Your position is currently on the ${chainName} Network`;

  return (
    <>
      {isEditing ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="40px"
        >
          <Typography variant="body2" height="40px" lineHeight="40px">
            Manage your position
          </Typography>
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
          }}
        >
          {[ActionType.ADD, ActionType.REMOVE].map((p) => (
            <TabChip
              key={`${p}`}
              sx={p === ActionType.REMOVE ? { marginLeft: 1 } : {}}
              selected={actionType === p}
              label={`${p === ActionType.ADD ? 'Add' : 'Remove'} Position`}
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
