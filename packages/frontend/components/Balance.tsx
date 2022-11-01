import { Token } from "@x-fuji/sdk"

type Props = {
  balance: number
  token?: Token
  dataCy?: string
}

// Format the balance depending of the token
// If no token is specified, 5 digits is used
// else, eth based tokens use 4 digits
const Balance = ({ balance, token, dataCy }: Props) => {
  const bal = balance.toLocaleString()
  const balLength = token?.symbol.includes("ETH") ? 5 : 5
  const formattedBalance = bal.substring(0, balLength)

  return (
    <span id="balance-amount" data-cy={dataCy}>
      {formattedBalance}
    </span>
  )
}

export default Balance
