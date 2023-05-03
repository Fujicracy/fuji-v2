import { toNotSoFixed } from '../../helpers/values';

type Props = {
  balance?: number;
  /**
   * Allow rounding.
   * @default false
   * @example 1,200.42 -> 1.2K,
   * @example 3,234,123 -> 3,2M
   */
  rounding?: boolean;
  symbol?: string;
  dataCy?: string;
};

function Balance({ balance, symbol, dataCy }: Props) {
  const formattedBalance = toNotSoFixed(balance, true); //formatBalance(balance)
  return (
    <span id="balance-amount" data-cy={dataCy}>
      {formattedBalance} {symbol}
    </span>
  );
}

export default Balance;
