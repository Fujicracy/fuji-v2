import { ethers } from "ethers"
import { NextPage } from "next"

import { useRouter } from "next/router"
import BorrowWrapper from "../../components/Borrow/Wrapper"
import { isChain } from "../../services/chains"

const PositionPage: NextPage = () => {
  const router = useRouter()
  const { pid } = router.query

  const query = typeof pid === "string" ? pid.split("-") : []
  const address = query[0]
  const chain = query[1]

  if (!address || !chain) {
    return <></>
  }

  if (
    (address && !ethers.utils.isAddress(address)) ||
    (chain && !isChain(Number(chain)))
  ) {
    router.push("/borrow")
  }

  // If we want to make sure that the address corresponds to a vault, we need to
  // 1) get data from the store
  // 2) if there's no data yet, fetch it
  // Meaning we need to show a loader and in case it fails, redirect to /borrow

  return (
    <BorrowWrapper
      managePosition
      query={{
        address,
        chain,
      }}
    />
  )
}

export default PositionPage
