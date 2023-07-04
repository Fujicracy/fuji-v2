import { VaultType } from '@x-fuji/sdk';
import { ethers } from 'ethers';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import BorrowWrapper from '../../components/Borrow/Wrapper';
import { isChain } from '../../helpers/chains';
import { showBorrow } from '../../helpers/navigation';
import { useBorrow } from '../../store/borrow.store';
import { FormType } from '../../store/types/state';
import LendingPage from '../lend';

const formType = FormType.Edit;

const PositionPage: NextPage = () => {
  const router = useRouter();
  const { pid } = router.query;

  const changeFormType = useBorrow((state) => state.changeFormType);

  const query = typeof pid === 'string' ? pid.split('&') : [];
  const urlType = query[0];
  const vault = query[1]?.split('-') || [];
  const type =
    urlType === 'borrow'
      ? VaultType.BORROW
      : urlType === 'lend'
      ? VaultType.LEND
      : undefined;
  const address = vault[0];
  const chain = vault[1];

  useEffect(() => {
    changeFormType(formType);
  }, [changeFormType]);

  if (type === undefined || !address || !chain) {
    return <></>;
  }

  if (
    (address && !ethers.utils.isAddress(address)) ||
    (chain && !isChain(Number(chain)))
  ) {
    showBorrow(router);
  }

  return type === VaultType.BORROW ? (
    <BorrowWrapper
      formType={formType}
      query={{
        address,
        chain,
      }}
    />
  ) : (
    <LendingPage />
  );
};

export default PositionPage;
