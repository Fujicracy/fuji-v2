import { VaultType } from '@x-fuji/sdk';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';

import LendingWrapper from '../components/Lending/Wrapper';
import { AssetType } from '../helpers/assets';
import { navigationalTaskDelay } from '../helpers/navigation';
import { useAuth } from '../store/auth.store';
import { useLend } from '../store/lend.store';
import { useNavigation } from '../store/navigation.store';
import { FormType } from '../store/types/state';

const formType = FormType.Create;

const LendingPage: NextPage = () => {
  const chainId = useAuth((state) => state.chainId);
  const shouldResetPage = useNavigation((state) => state.lendPage.shouldReset);

  const changeFormType = useLend((state) => state.changeFormType);
  const changeAssetChain = useLend((state) => state.changeAssetChain);
  const clearInputValues = useLend((state) => state.clearInputValues);
  const changeShouldPageReset = useNavigation(
    (state) => state.changePageShouldReset
  );

  const [hasChain, setHasChain] = useState(false);

  if (shouldResetPage) {
    clearInputValues();
    navigationalTaskDelay(() => changeShouldPageReset(VaultType.LEND, false));
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

  return <LendingWrapper formType={FormType.Create} />;
};

export default LendingPage;
