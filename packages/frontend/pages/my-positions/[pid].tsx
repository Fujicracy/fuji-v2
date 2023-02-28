import { ethers } from "ethers"
import { NextPage } from "next"

import { useRouter } from "next/router"
import BorrowWrapper from "../../components/Borrow/Wrapper"
import { isChain } from "../../helpers/chains"

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
