import { getAddress } from '@ethersproject/address';
import { AddressZero } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

export class Address {
  private _address: string;

  constructor(addr: string) {
    if (addr !== AddressZero) {
      try {
        const checksummedAddress = getAddress(addr);
        if (addr !== checksummedAddress)
          console.warn(`${addr} is not checksummed.`);
        //warning(address === checksummedAddress, `${address} is not checksummed.`);
        this._address = checksummedAddress;
      } catch (error) {
        invariant(false, `${addr} is not a valid address.`);
      }
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
