import { AddressZero } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

import { validateAndParseAddress } from '../functions/validateAndParseAddress';

export class Address {
  private _address: string;

  constructor(addr: string) {
    if (addr !== AddressZero) {
      const result = validateAndParseAddress(addr);
      if (!result.success) {
        invariant(false, result.error.message);
      }
      this._address = result.data;
    } else this._address = addr;
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
