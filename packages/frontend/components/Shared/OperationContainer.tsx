import { useState } from 'react';

import { ActionType } from '../../helpers/assets';
import { PositionData } from '../../helpers/positions';
import { TransactionMeta } from '../../helpers/transactions';
import ConfirmTransactionModal from './ConfirmTransaction/ConfirmTransactionModal';

type OperationContainerProps = {
  children: React.ReactNode;
  positionData: PositionData | undefined;
  transactionMeta: TransactionMeta;
  actionType: ActionType;
  handler: () => void;
};

function OperationContainer({
  children,
  positionData,
  transactionMeta,
  actionType,
  handler,
}: OperationContainerProps) {
  const [isConfirmationModalShown, setIsConfirmationModalShown] =
    useState(false);

  return (
    <>
      {children}
      <ConfirmTransactionModal
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
