import { AddressMap } from '../types';
import { ChainId } from '../enums';
import { Address } from '../entities';

export const CONNEXT_ROUTER: AddressMap = {
  [ChainId.GOERLI]: Address.from(''),
  [ChainId.MATIC_MUMBAI]: Address.from(''),
  [ChainId.OPTIMISM_GOERLI]: Address.from(''),
};
