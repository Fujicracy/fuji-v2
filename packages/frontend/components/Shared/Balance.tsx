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

// Format the balance depending of the token
// If no token is specified, 5 digits is used
// else, eth based tokens use 4 digits
const Balance = ({ balance, rounding, symbol, dataCy }: Props) => {
  const formattedBalance =
    balance?.toLocaleString("en-US", {
      notation: rounding ? "compact" : "standard",
    }) ?? "0"

  return (
    <span id="balance-amount" data-cy={dataCy}>
      {formattedBalance} {symbol}
    </span>
  )
}

export default Balance
