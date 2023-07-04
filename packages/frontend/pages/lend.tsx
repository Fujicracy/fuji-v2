import { NextPage } from 'next';

import LendingWrapper from '../components/Lending/Wrapper';
import { FormType } from '../store/types/state';

const LendingPage: NextPage = () => {
  return <LendingWrapper formType={FormType.Create} />;
};

export default LendingPage;
