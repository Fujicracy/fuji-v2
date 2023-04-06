import { NextPage } from 'next';
import { useEffect, useState } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { hexToChainId } from '../helpers/chains';
import { useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';

const BorrowPage: NextPage = () => {
  const changeFormType = useBorrow((state) => state.changeFormType);
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  );
  const changeDebtChain = useBorrow((state) => state.changeDebtChain);

  const walletChain = useAuth((state) => state.chain);
  const [hasChain, setHasChain] = useState(false);

  useEffect(() => {
    changeFormType('create');
  }, [changeFormType]);

  useEffect(() => {
    if (walletChain && !hasChain) {
      setHasChain(true);
      const chainId = hexToChainId(walletChain.id);
      if (!chainId) return;
      changeCollateralChain(chainId, false);
      changeDebtChain(chainId, false);
    }
  }, [hasChain, walletChain, changeCollateralChain, changeDebtChain]);

  return <BorrowWrapper />;
};

export default BorrowPage;
