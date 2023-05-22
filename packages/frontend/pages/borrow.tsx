import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { useAuth } from '../store/auth.store';
import { FormType, useBorrow } from '../store/borrow.store';

const BorrowPage: NextPage = () => {
  const changeFormType = useBorrow((state) => state.changeFormType);
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  );
  const clearDebt = useBorrow((state) => state.clearDebt);
  const changeDebtChain = useBorrow((state) => state.changeDebtChain);

  const allowChainOverride = useBorrow((state) => state.allowChainOverride);

  const chainId = useAuth((state) => state.chainId);
  const [hasChain, setHasChain] = useState(false);

  useEffect(() => {
    clearDebt();
  }, [clearDebt]);

  useEffect(() => {
    changeFormType(FormType.Create);
  }, [changeFormType]);

  useEffect(() => {
    if (chainId && !hasChain) {
      setHasChain(true);
      if (!allowChainOverride || !chainId) return;
      changeCollateralChain(chainId, false);
      changeDebtChain(chainId, true);
    }
  }, [
    allowChainOverride,
    hasChain,
    chainId,
    changeCollateralChain,
    changeDebtChain,
  ]);

  return <BorrowWrapper />;
};

export default BorrowPage;
