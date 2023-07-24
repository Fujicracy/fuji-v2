import { Box, Stack, Typography } from '@mui/material';

import { NetworkIcon } from '../../Icons';
import { TooltipWrapper } from '../../Tooltips';
import Slippage from './Slippage';

type HeaderInfoProps = {
  isEditing: boolean;
  isCrossChainOperation: boolean;
  chainName: string;
  tooltipMessage?: string;
  defaultOpen?: boolean;
};

function HeaderInfo({
  isEditing,
  isCrossChainOperation,
  chainName,
  tooltipMessage,
  defaultOpen = false,
}: HeaderInfoProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      height="40px"
    >
      {isCrossChainOperation && (
        <Box sx={{ mr: '1rem' }}>
          <Slippage />
        </Box>
      )}
      {!isEditing || chainName === '' ? (
        <></>
      ) : tooltipMessage ? (
        <TooltipWrapper
          defaultOpen={defaultOpen}
          placement="top"
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '12rem',
              }}
            >
              <Typography variant="small" fontSize="0.75rem">
                {tooltipMessage}
              </Typography>
            </Box>
          }
        >
          <Box width={18} height={18}>
            <NetworkIcon network={chainName} height={18} width={18} />
          </Box>
        </TooltipWrapper>
      ) : (
        <NetworkIcon network={chainName} height={18} width={18} />
      )}
    </Stack>
  );
}

export default HeaderInfo;
