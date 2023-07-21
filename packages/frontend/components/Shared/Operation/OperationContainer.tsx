import { VaultType } from '@x-fuji/sdk';

import { ActionType } from '../../../helpers/assets';
import { PositionData } from '../../../helpers/positions';
import { TransactionMeta } from '../../../helpers/transactions';
import ConfirmTransactionModal from './ConfirmTransaction/ConfirmTransactionModal';

type OperationContainerProps = {
  type: VaultType;
  children: React.ReactNode;
  isConfirmationModalShown: boolean;
  setIsConfirmationModalShown: (value: boolean) => void;
  positionData: PositionData | undefined;
  transactionMeta: TransactionMeta;
  actionType: ActionType;
  handler: () => void;
};

function OperationContainer({
  type,
  children,
  isConfirmationModalShown,
  setIsConfirmationModalShown,
  positionData,
  transactionMeta,
  actionType,
  handler,
}: OperationContainerProps) {
  return (
    <>
      {children}
      <ConfirmTransactionModal
        type={type}
        open={isConfirmationModalShown}
        onClose={() => setIsConfirmationModalShown(false)}
        positionData={positionData}
        transactionMeta={transactionMeta}
        actionType={actionType}
        action={() => {
          setIsConfirmationModalShown(false);
          handler();
        }}
      />
    </>
  );
}

export default OperationContainer;
