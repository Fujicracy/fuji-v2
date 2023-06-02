import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { AssetType } from '../helpers/assets';
import { useAuth } from '../store/auth.store';
import { FormType, useBorrow } from '../store/borrow.store';

const formType = FormType.Create;

const BorrowPage: NextPage = () => {
  const chainId = useAuth((state) => state.chainId);
  const shouldResetPage = useBorrow((state) => state.shouldResetPage);

  const changeFormType = useBorrow((state) => state.changeFormType);
  const changeAssetChain = useBorrow((state) => state.changeAssetChain);
  const changeInputValues = useBorrow((state) => state.changeInputValues);
  const clearDebt = useBorrow((state) => state.clearDebt);

  const [hasChain, setHasChain] = useState(false);

  if (shouldResetPage) {
    clearDebt();
    changeInputValues('', '');
  }

  useEffect(() => {
    changeFormType(formType);
  }, [changeFormType]);

  useEffect(() => {
    if (chainId && !hasChain) {
      setHasChain(true);
      if (!shouldResetPage || !chainId) return;
      changeAssetChain(AssetType.Collateral, chainId, false);
    }
  }, [shouldResetPage, hasChain, chainId, changeAssetChain]);

  return <BorrowWrapper formType={formType} />;
};

export default BorrowPage;
