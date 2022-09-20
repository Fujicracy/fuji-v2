import type { NextPage } from "next"
import Head from "next/head"
import Borrow from "../components/Borrow"
import Header from "../components/Header"

const BorrowPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Borrow - xFuji</title>
        <meta
          name="description"
          content="borrow at the best rate on any chain"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main>
        <Borrow />
      </main>

      <footer style={{ marginTop: "3rem" }}>Footer ©</footer>
    </div>
  )
}

export default BorrowPage
