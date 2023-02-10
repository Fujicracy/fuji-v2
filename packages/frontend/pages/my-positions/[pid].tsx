import { NextPage } from "next"

import { useRouter } from "next/router"
import BorrowWrapper from "../../components/Borrow/Wrapper"

const PositionPage: NextPage = () => {
  const router = useRouter()
  const { pid } = router.query // Contains chain-vault, need to separate into two and grab the right data

  return <BorrowWrapper position />
}

export default PositionPage
