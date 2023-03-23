import { NextPage } from 'next';
import { useEffect } from 'react';

import BorrowWrapper from '../components/Borrow/Wrapper';
import { useBorrow } from '../store/borrow.store';

const BorrowPage: NextPage = () => {
  const changeFormType = useBorrow((state) => state.changeFormType);

  useEffect(() => {
    changeFormType('create');
  }, [changeFormType]);

  return <BorrowWrapper />;
};

export default BorrowPage;
