import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { useAuth } from '../store/auth.store';
import { FormType, useBorrow } from '../store/borrow.store';

const formType = FormType.Create;

const BorrowPage: NextPage = () => {
  const changeFormType = useBorrow((state) => state.changeFormType);
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  );
  const changeDebtChain = useBorrow((state) => state.changeDebtChain);

  const allowChainOverride = useBorrow((state) => state.allowChainOverride);

  const chainId = useAuth((state) => state.chainId);
  const [hasChain, setHasChain] = useState(false);

  useEffect(() => {
    changeFormType(formType);
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

  return <BorrowWrapper formType={formType} />;
};

export default BorrowPage;
