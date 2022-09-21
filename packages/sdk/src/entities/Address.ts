import { validateAndParseAddress } from '../functions/validateAndParseAddress';
import invariant from 'tiny-invariant';

export class Address {
  private _address: string;

  public constructor(addr: string) {
    if (addr !== '') this._address = validateAndParseAddress(addr);
    else this._address = addr;
  }

  public static from(addr: string): Address {
    return new Address(addr);
  }

  public get value(): string {
    if (this._address === '') invariant(false, 'Missing address!');
    return this._address;
  }
}
