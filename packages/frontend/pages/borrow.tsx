import { VaultType } from '@x-fuji/sdk';
import { NextPage } from 'next';
import React, { useEffect, useState } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { AssetType } from '../helpers/assets';
import { navigationalTaskDelay } from '../helpers/navigation';
import { useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';
import { useNavigation } from '../store/navigation.store';
import { FormType } from '../store/types/state';

const formType = FormType.Create;

const BorrowPage: NextPage = () => {
  const chainId = useAuth((state) => state.chainId);
  const shouldResetPage = useNavigation(
    (state) => state.borrowPage.shouldReset
  );

  const changeFormType = useBorrow((state) => state.changeFormType);
  const changeAssetChain = useBorrow((state) => state.changeAssetChain);
  const clearInputValues = useBorrow((state) => state.clearInputValues);
  const changeShouldPageReset = useNavigation(
    (state) => state.changePageShouldReset
  );
  const clearDebt = useBorrow((state) => state.clearDebt);

  const [hasChain, setHasChain] = useState(false);

  useEffect(() => {
    if (shouldResetPage) {
      clearDebt();
      clearInputValues();
      navigationalTaskDelay(() =>
        changeShouldPageReset(VaultType.BORROW, false)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
