import { NextPage } from "next"

import Router, { useRouter } from "next/router"
import BorrowWrapper from "../../components/Borrow/Wrapper"

const PositionPage: NextPage = () => {
  const router = useRouter()
  const { address } = router.query // Contains chain-vault, need to separate into two and grab the right data

  // if (address instanceof String) {
  //   window.alert(address)
  // }

  // If we want to make sure that the address is valid and that having the data, we need to
  // 1) get data from the store
  // 2) if there's no data yet, fetch it
  // Meaning we need to show a loader and in case it fails, redirect to /borrow

  return <BorrowWrapper managePosition />
}

export default PositionPage
