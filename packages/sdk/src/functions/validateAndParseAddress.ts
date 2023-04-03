import { getAddress } from '@ethersproject/address';

import { FujiResultError, FujiResultSuccess } from '../entities';
import { FujiResult } from '../types';

// warns if addresses are not checksummed
export function validateAndParseAddress(address: string): FujiResult<string> {
  try {
    const checksummedAddress = getAddress(address);
    if (address !== checksummedAddress)
      console.warn(`${address} is not checksummed.`);
    //warning(address === checksummedAddress, `${address} is not checksummed.`);
    return new FujiResultSuccess(checksummedAddress);
  } catch (error) {
    return new FujiResultError(`${address} is not a valid address.`);
  }
}
