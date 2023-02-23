import { ethers } from "ethers"
import { NextPage } from "next"

import { useRouter } from "next/router"
import BorrowWrapper from "../../components/Borrow/Wrapper"

const PositionPage: NextPage = () => {
  const router = useRouter()
  const { address } = router.query

  const addr = address instanceof String ? (address as string) : undefined

  if (!addr || !ethers.utils.isAddress(addr)) {
    router.push("/borrow")
    return <></>
  }

  // If we want to make sure that the address corresponds to a vault, we need to
  // 1) get data from the store
  // 2) if there's no data yet, fetch it
  // Meaning we need to show a loader and in case it fails, redirect to /borrow

  return <BorrowWrapper managePosition address={addr} />
}

export default PositionPage
