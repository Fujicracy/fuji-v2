import invariant from 'tiny-invariant';

import { WNATIVE } from '../../constants/tokens';
import { Address } from '../Address';
import { Currency } from '../Currency';
import { NativeCurrency } from '../NativeCurrency';
import { Token } from '../Token';

/**
 * Ether is the main usage of a 'native' currency, i.e. for Ethereum mainnet and all testnets
 */
export class XDai extends NativeCurrency {
  protected constructor(chainId: number) {
    super(
      Address.from('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'),
      chainId,
      18,
      'xDai',
      'xDai'
    );
  }

  public get wrapped(): Token {
    const weth9 = WNATIVE[this.chainId];
    invariant(!!weth9, 'WRAPPED');
    return weth9;
  }

  private static _cache: { [chainId: number]: XDai } = {};

  public static onChain(chainId: number): XDai {
    return this._cache[chainId] ?? (this._cache[chainId] = new XDai(chainId));
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }
}
