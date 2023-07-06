import { NextPage } from 'next';
import { useEffect } from 'react';

import LendingWrapper from '../components/Lending/Wrapper';
import { useLend } from '../store/lend.store';
import { FormType } from '../store/types/state';

const formType = FormType.Create;

const LendingPage: NextPage = () => {
  const changeFormType = useLend((state) => state.changeFormType);

  useEffect(() => {
    changeFormType(formType);
  }, [changeFormType]);

  return <LendingWrapper formType={FormType.Create} />;
};

export default LendingPage;
