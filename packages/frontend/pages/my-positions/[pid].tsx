import { NextPage } from "next"

import Router, { useRouter } from "next/router"
import BorrowWrapper from "../../components/Borrow/Wrapper"

const PositionPage: NextPage = () => {
  const router = useRouter()
  const { pid } = router.query // Contains chain-vault, need to separate into two and grab the right data

  // Router.push("/borrow") // If pid is invalid or if vault balance is null, redirect to borrow

  return <BorrowWrapper managePosition />
}

export default PositionPage
