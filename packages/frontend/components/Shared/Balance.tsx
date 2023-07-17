import { DUST_AMOUNT } from '../../constants';
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

function Balance({ balance = 0, symbol, dataCy }: Props) {
  const formattedBalance = toNotSoFixed(balance, true);

  return (
    <span id="balance-amount" data-cy={dataCy}>
      {balance > 0 && balance < DUST_AMOUNT ? '< 0.0001' : formattedBalance}{' '}
      {symbol}
    </span>
  );
}

export default Balance;
