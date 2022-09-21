import { NextPage } from 'next'
import Head from 'next/head'

import Borrow from '../components/Borrow'
import Footer from '../components/Footer'
import Header from '../components/Header'

const BorrowPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Borrow - xFuji</title>
        <meta
          name='description'
          content='borrow at the best rate on any chain'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Header />

      <main>
        <Borrow />
      </main>

      <Footer />
    </div>
  )
}

export default BorrowPage
