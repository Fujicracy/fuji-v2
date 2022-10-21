import { Token } from "@x-fuji/sdk"

type Props = {
  balance: number
  token?: Token
}

// Format the balance depending of the token
// If no token is specified, 5 digits is used
// else, eth based tokens use 4 digits
const Balance = (props: Props) => {
  const { balance, token } = props
  const bal = balance.toString()
  const formattedBalance = token?.name?.includes("ETH")
    ? `${bal.toString().substring(0, 5)}`
    : `${bal.substring(0, 4)} `

  return <>{formattedBalance}</>
}

export default Balance
