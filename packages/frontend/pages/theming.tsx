import { NextPage } from 'next';
import Head from 'next/head';

import Header from '../components/Shared/Header/Header';
import Theming from '../components/Theming/Theming';

const ThemingPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Theming - xFuji</title>
        <meta name="description" content="Theming tests" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main>
        <Theming />
      </main>
    </div>
  );
};

export default ThemingPage;
