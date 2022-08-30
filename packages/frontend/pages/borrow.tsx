import type { NextPage } from "next"
import Head from "next/head"
import Borrow from "../components/Borrow"

const Home: NextPage = () => {
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

      <main>
        <Borrow />
      </main>

      <footer style={{ marginTop: "3rem" }}>Footer ©</footer>
    </div>
  )
}

export default Home
