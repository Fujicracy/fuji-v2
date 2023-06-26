import { ethers } from 'ethers';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import BorrowWrapper from '../../components/Borrow/Wrapper';
import { isChain } from '../../helpers/chains';
import { showBorrow } from '../../helpers/navigation';
import { useBorrow } from '../../store/borrow.store';
import { FormType } from '../../store/shared/state';

const formType = FormType.Edit;

const PositionPage: NextPage = () => {
  const router = useRouter();
  const { pid } = router.query;

  const changeFormType = useBorrow((state) => state.changeFormType);

  const query = typeof pid === 'string' ? pid.split('-') : [];
  const address = query[0];
  const chain = query[1];

  useEffect(() => {
    changeFormType(formType);
  }, [changeFormType]);

  if (!address || !chain) {
    return <></>;
  }

  if (
    (address && !ethers.utils.isAddress(address)) ||
    (chain && !isChain(Number(chain)))
  ) {
    showBorrow(router);
  }
  return (
    <BorrowWrapper
      formType={formType}
      query={{
        address,
        chain,
      }}
    />
  );
};

export default PositionPage;
