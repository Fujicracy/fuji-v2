import { Box } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';

import { SignTooltip } from '../Tooltips';
import WarningInfo from '../WarningInfo';
import Fees from './Fees';

type OperationInfoProps = {
  type: VaultType;
  shouldShowFees: boolean;
  shouldSignTooltipBeShown: boolean;
  shouldWarningBeDisplayed: boolean;
  warningContent: JSX.Element;
};

function OperationInfo({
  type,
  shouldShowFees,
  shouldSignTooltipBeShown,
  shouldWarningBeDisplayed,
  warningContent,
}: OperationInfoProps) {
  return (
    <>
      <Box m="1rem 0">{shouldShowFees && <Fees type={type} />}</Box>
      {shouldSignTooltipBeShown ? <SignTooltip /> : <></>}
      {shouldWarningBeDisplayed && (
        <Box mb={2}>
          <WarningInfo text={warningContent} />
        </Box>
      )}
    </>
  );
}

export default OperationInfo;
