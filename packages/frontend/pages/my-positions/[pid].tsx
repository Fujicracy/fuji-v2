import { VaultType } from '@x-fuji/sdk';
import { ethers } from 'ethers';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import BorrowWrapper from '../../components/Borrow/Wrapper';
import LendingWrapper from '../../components/Lending/Wrapper';
import { isChain } from '../../helpers/chains';
import { showBorrow, showLend } from '../../helpers/navigation';
import { useBorrow } from '../../store/borrow.store';
import { useLend } from '../../store/lend.store';
import { FormType } from '../../store/types/state';

const formType = FormType.Edit;

const PositionPage: NextPage = () => {
  const router = useRouter();
  const { pid } = router.query;

  const changeBorrowingFormType = useBorrow((state) => state.changeFormType);
  const changeLendingFormType = useLend((state) => state.changeFormType);

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
    if (type === VaultType.BORROW) {
      changeBorrowingFormType(formType);
    } else {
      changeLendingFormType(formType);
    }
  }, [type, changeBorrowingFormType, changeLendingFormType]);

  if (type === undefined || !address || !chain) {
    return <></>;
  }

  if (
    (address && !ethers.utils.isAddress(address)) ||
    (chain && !isChain(Number(chain)))
  ) {
    if (type === VaultType.BORROW) {
      showBorrow(router);
    } else {
      showLend(router);
    }
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
    <LendingWrapper
      formType={formType}
      query={{
        address,
        chain,
      }}
    />
  );
};

export default PositionPage;
