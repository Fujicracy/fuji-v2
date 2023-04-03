import { getAddress } from '@ethersproject/address';
import invariant from 'tiny-invariant';

// warns if addresses are not checksummed
export function validateAndParseAddress(address: string): string {
  try {
    const checksummedAddress = getAddress(address);
    if (address !== checksummedAddress)
      console.warn(`${address} is not checksummed.`);
    //warning(address === checksummedAddress, `${address} is not checksummed.`);
    return checksummedAddress;
  } catch (error) {
    invariant(false, `${address} is not a valid address.`);
  }
}
