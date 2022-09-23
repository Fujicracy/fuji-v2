import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { Address, Vault } from '../entities';
import { USDC, WNATIVE } from './tokens';
import { AddressZero } from '@ethersproject/constants';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [
    new Vault(
      Address.from(AddressZero),
      WNATIVE[ChainId.GOERLI],
      USDC[ChainId.GOERLI]
    ),
  ],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [
    new Vault(
      Address.from(AddressZero),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDC[ChainId.MATIC_MUMBAI]
    ),
  ],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [
    new Vault(
      Address.from(AddressZero),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDC[ChainId.OPTIMISM_GOERLI]
    ),
  ],
};
