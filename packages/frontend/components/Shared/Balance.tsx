import { formatBalance } from "../../helpers/values"

type Props = {
  balance?: number
  /**
   * Allow rounding.
   * @default false
   * @example 1,200.42 -> 1.2K,
   * @example 3,234,123 -> 3,2M
   */
  rounding?: boolean
  symbol?: string
  dataCy?: string
}

const Balance = ({ balance, rounding, symbol, dataCy }: Props) => {
  const formattedBalance = formatBalance(balance, rounding)

  return (
    <span id="balance-amount" data-cy={dataCy}>
      {formattedBalance} {symbol}
    </span>
  )
}

export default Balance
