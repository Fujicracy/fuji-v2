import invariant from 'tiny-invariant';

import { WNATIVE } from '../../constants/tokens';
import { Address } from '../Address';
import { Currency } from '../Currency';
import { NativeCurrency } from '../NativeCurrency';
import { Token } from '../Token';

export class Fantom extends NativeCurrency {
  protected constructor(chainId: number) {
    super(
      Address.from('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'),
      chainId,
      18,
      'FTM',
      'Fantom'
    );
  }

  public get wrapped(): Token {
    const wnative = WNATIVE[this.chainId];
    invariant(!!wnative, 'WRAPPED');
    return wnative;
  }

  private static _cache: { [chainId: number]: Fantom } = {};

  public static onChain(chainId: number): Fantom {
    return this._cache[chainId] ?? (this._cache[chainId] = new Fantom(chainId));
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }
}
