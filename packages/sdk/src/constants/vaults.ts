import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { Address, Vault } from '../entities';
import { USDC, WNATIVE } from './tokens';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [
    new Vault(Address.from(''), WNATIVE[ChainId.GOERLI], USDC[ChainId.GOERLI]),
  ],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [
    new Vault(
      Address.from(''),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDC[ChainId.MATIC_MUMBAI]
    ),
  ],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [
    new Vault(
      Address.from(''),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDC[ChainId.OPTIMISM_GOERLI]
    ),
  ],
};
