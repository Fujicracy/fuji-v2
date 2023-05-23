import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { AssetType } from '../helpers/assets';
import { useAuth } from '../store/auth.store';
import { FormType, useBorrow } from '../store/borrow.store';

const formType = FormType.Create;

const BorrowPage: NextPage = () => {
  const chainId = useAuth((state) => state.chainId);
  const allowChainOverride = useBorrow((state) => state.allowChainOverride);

  const changeFormType = useBorrow((state) => state.changeFormType);
  const changeAssetChain = useBorrow((state) => state.changeAssetChain);

  const [hasChain, setHasChain] = useState(false);

  useEffect(() => {
    changeFormType(formType);
  }, [changeFormType]);

  useEffect(() => {
    if (chainId && !hasChain) {
      setHasChain(true);
      if (!allowChainOverride || !chainId) return;
      changeAssetChain(AssetType.Collateral, chainId, false);
      changeAssetChain(AssetType.Debt, chainId, true);
    }
  }, [allowChainOverride, hasChain, chainId, changeAssetChain]);

  return <BorrowWrapper formType={formType} />;
};

export default BorrowPage;
