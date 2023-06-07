import { Box, Stack, Typography } from '@mui/material';

import { NetworkIcon } from '../../Shared/Icons';
import { TooltipWrapper } from '../../Shared/Tooltips';
import Slippage from './Slippage';

type HeaderInfoProps = {
  isCrossChainOperation: boolean;
  chainName: string;
  tooltipMessage?: string;
};

function HeaderInfo({
  isCrossChainOperation,
  chainName,
  tooltipMessage,
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
      {chainName === '' ? (
        <></>
      ) : tooltipMessage ? (
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
              <Typography variant="small">{tooltipMessage}</Typography>
            </Box>
          }
        >
          <NetworkIcon network={chainName} height={18} width={18} />
        </TooltipWrapper>
      ) : (
        <NetworkIcon network={chainName} height={18} width={18} />
      )}
    </Stack>
  );
}

export default HeaderInfo;
