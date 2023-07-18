import { Box } from '@mui/material';

import { SignTooltip } from '../Tooltips';
import WarningInfo from '../WarningInfo';
import Fees from './Fees';

type OperationInfoProps = {
  shouldShowFees: boolean;
  shouldSignTooltipBeShown: boolean;
  shouldWarningBeDisplayed: boolean;
  warningContent: JSX.Element;
};

function OperationInfo({
  shouldShowFees,
  shouldSignTooltipBeShown,
  shouldWarningBeDisplayed,
  warningContent,
}: OperationInfoProps) {
  return (
    <>
      <Box m="1rem 0">{shouldShowFees && <Fees />}</Box>
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
