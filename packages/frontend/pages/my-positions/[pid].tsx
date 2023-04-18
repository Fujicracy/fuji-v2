import { ethers } from 'ethers';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import BorrowWrapper from '../../components/Borrow/Wrapper';
import { isChain } from '../../helpers/chains';
import { showBorrow } from '../../helpers/navigation';
import { useBorrow } from '../../store/borrow.store';

const PositionPage: NextPage = () => {
  const router = useRouter();
  const { pid } = router.query;

  const query = typeof pid === 'string' ? pid.split('-') : [];
  const address = query[0];
  const chain = query[1];

  const changeFormType = useBorrow((state) => state.changeFormType);

  useEffect(() => {
    changeFormType('edit');
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
      query={{
        address,
        chain,
      }}
    />
  );
};

export default PositionPage;
