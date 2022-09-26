import { validateAndParseAddress } from '../functions/validateAndParseAddress';
import invariant from 'tiny-invariant';
import { AddressZero } from '@ethersproject/constants';

export class Address {
  private _address: string;

  constructor(addr: string) {
    if (addr !== AddressZero) this._address = validateAndParseAddress(addr);
    else this._address = addr;
  }

  static from(addr: string): Address {
    return new Address(addr);
  }

  equals(other: Address): boolean {
    return this._address === other.value;
  }

  get value(): string {
    if (this._address === AddressZero) invariant(false, 'Missing address!');
    return this._address;
  }
}
