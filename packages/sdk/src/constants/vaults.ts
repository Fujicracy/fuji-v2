import { Address, BorrowingVault } from '../entities';
import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { DAI, USDC, USDT, WNATIVE } from './tokens';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [
    new BorrowingVault(
      Address.from('0xD08b093b4804DEC9af22f70Bc35E8e132106B5C2'),
      WNATIVE[ChainId.GOERLI],
      DAI[ChainId.GOERLI]
    ),
  ],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [
    new BorrowingVault(
      Address.from('0xDdd86428204f12f296954c9CdFC73F3275f0D8a0'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      DAI[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0xE4903ba1b082b678bd5C935f43988811eE85aD48'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDC[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0x03c9BA7110F17c080E1B05df507D9dcba8FB157e'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDT[ChainId.MATIC_MUMBAI]
    ),
  ],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [
    new BorrowingVault(
      Address.from('0xf5A39De230ca0DaD78534D83f0eA1F8b2a4FC622'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      DAI[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0xBAe6e16818b2748bf769be230a4ED323f29Ba9aF'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDC[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0x0C3A3A2a49CACE680011D91f7bbc01d7EC8a0788'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDT[ChainId.OPTIMISM_GOERLI]
    ),
  ],
};
